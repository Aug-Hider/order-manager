import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whatsappSessions, pizzas, supplements, desserts, pizzeriaConfigs, orders, pizzerias } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { parseOrderIntent, calculateAvailability } from '@/lib/ai/pizza-parser';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

// Verify webhook (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return NextResponse.json({ ok: true });

    const from = message.from;
    const text = message.text?.body || '';
    const toNumber = body.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number;

    const pizzeria = await db.query.pizzerias.findFirst({
      where: eq(pizzerias.whatsappNumber, toNumber),
      with: { config: true },
    });
    if (!pizzeria) return NextResponse.json({ error: 'Pizzeria not found' }, { status: 404 });

    let session = await db.query.whatsappSessions.findFirst({
      where: and(
        eq(whatsappSessions.pizzeriaId, pizzeria.id),
        eq(whatsappSessions.customerPhone, from),
        eq(whatsappSessions.status, 'active')
      ),
      orderBy: desc(whatsappSessions.createdAt),
    });

    if (!session) {
      const [newSession] = await db.insert(whatsappSessions).values({
        pizzeriaId: pizzeria.id, customerPhone: from, status: 'active', currentStep: 'intake',
      }).returning();
      session = newSession;
    }

    const response = await handleStep(session, text, pizzeria);
    await sendWhatsAppMessage(from, response.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleStep(session: any, message: string, pizzeria: any) {
  if (session.currentStep === 'intake') return handleIntake(session, message, pizzeria);
  if (session.currentStep === 'confirming_time') return handleTimeConfirmation(session, message, pizzeria);
  if (session.currentStep === 'payment') return handlePaymentStatus(session, pizzeria);
  return { message: `🍕 *${pizzeria.name}*\n\nBienvenue ! Envoyez votre commande. Ex: "2 pizzas 4 fromages + oignons"` };
}

async function handleIntake(session: any, message: string, pizzeria: any) {
  const [availablePizzas, availableSupplements, availableDesserts] = await Promise.all([
    db.query.pizzas.findMany({ where: and(eq(pizzas.pizzeriaId, pizzeria.id), eq(pizzas.isAvailable, true)) }),
    db.query.supplements.findMany({ where: and(eq(supplements.pizzeriaId, pizzeria.id), eq(supplements.isAvailable, true)) }),
    db.query.desserts.findMany({ where: and(eq(desserts.pizzeriaId, pizzeria.id), eq(desserts.isAvailable, true)) }),
  ]);

  const parsed = await parseOrderIntent(message, availablePizzas, availableSupplements, availableDesserts);

  if (!parsed.isOrderIntent || parsed.items.length === 0) {
    return { message: `🍕 *${pizzeria.name}*\n\nBienvenue ! Envoyez votre commande.\nEx: "2 pizzas 4 fromages + oignons, 1 tiramisu"` };
  }

  const cartItems: any[] = [];
  let total = 0;

  for (const item of parsed.items) {
    if (item.type === 'pizza') {
      const pizza = availablePizzas.find(p => p.aiKeywords.some((k: string) => k.toLowerCase() === item.name.toLowerCase()));
      if (!pizza) continue;
      const suppObjects = (item.supplements || []).map((suppName: string) => {
        const supp = availableSupplements.find(s => s.aiKeywords.some((k: string) => k.toLowerCase() === suppName.toLowerCase()));
        return supp ? { supplementId: supp.id, name: supp.name, price: parseFloat(supp.price) } : null;
      }).filter(Boolean);
      const suppTotal = suppObjects.reduce((sum: number, s: any) => sum + s.price, 0);
      const subtotal = (parseFloat(pizza.basePrice) + suppTotal) * item.quantity;
      cartItems.push({ type: 'pizza', pizzaId: pizza.id, name: pizza.name, basePrice: parseFloat(pizza.basePrice), quantity: item.quantity, supplements: suppObjects, subtotal });
      total += subtotal;
    } else if (item.type === 'dessert') {
      const dessert = availableDesserts.find(d => d.aiKeywords.some((k: string) => k.toLowerCase() === item.name.toLowerCase()));
      if (!dessert) continue;
      const subtotal = parseFloat(dessert.price) * item.quantity;
      cartItems.push({ type: 'dessert', itemId: dessert.id, name: dessert.name, price: parseFloat(dessert.price), quantity: item.quantity, subtotal });
      total += subtotal;
    }
  }

  await db.update(whatsappSessions).set({ cartItems, totalAmount: total.toFixed(2), currentStep: 'confirming_time' }).where(eq(whatsappSessions.id, session.id));

  const recap = cartItems.map((item, i) =>
    `${i + 1}. ${item.quantity}x ${item.name}${item.supplements?.length ? ' +' + item.supplements.map((s: any) => s.name).join(', ') : ''} = ${item.subtotal.toFixed(2)}€`
  ).join('\n');

  return { message: `📝 *Votre commande:*\n\n${recap}\n\n*Total: ${total.toFixed(2)}€*\n\n⏰ *À quelle heure souhaitez-vous retirer ?*\nEx: "18h30", "dans 45 minutes"` };
}

async function handleTimeConfirmation(session: any, message: string, pizzeria: any) {
  const requestedTime = parseTimeInput(message);
  if (!requestedTime) return { message: "Je n'ai pas compris l'heure. Ex: \"18h30\", \"dans 30 min\"" };

  const config = pizzeria.config || { pizzasPerHour: 12, averagePizzaTime: 5, maxConcurrentPizzas: 4 };
  const totalPizzas = (session.cartItems as any[]).filter((i: any) => i.type === 'pizza').reduce((sum: number, i: any) => sum + i.quantity, 0);
  const availability = await calculateAvailability(pizzeria.id, requestedTime, totalPizzas, config);

  if (!availability.available) {
    return { message: `⚠️ *Créneau complet*\n\n${availability.reason}\n\nProposez un autre horaire.` };
  }

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: (session.cartItems as any[]).map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: `${item.quantity}x ${item.name}` },
        unit_amount: Math.round((item.subtotal / item.quantity) * 100),
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/payment/cancel`,
    metadata: { whatsapp_session_id: session.id, customer_phone: session.customerPhone },
  });

  await db.update(whatsappSessions).set({
    requestedTime, estimatedReadyTime: availability.estimatedReadyTime,
    stripePaymentIntentId: stripeSession.id, stripeCheckoutUrl: stripeSession.url,
    paymentExpiresAt: new Date(Date.now() + 15 * 60000), currentStep: 'payment',
  }).where(eq(whatsappSessions.id, session.id));

  return {
    message: `✅ *Commande confirmée*\n\n💰 *Total: ${session.totalAmount}€*\n⏰ *Retrait: ${formatTime(availability.estimatedReadyTime)}*\n\n💳 *Paiement (15 min):*\n${stripeSession.url}`,
  };
}

async function handlePaymentStatus(session: any, pizzeria: any) {
  if (new Date() > new Date(session.paymentExpiresAt)) {
    await db.update(whatsappSessions).set({ status: 'expired' }).where(eq(whatsappSessions.id, session.id));
    return { message: '⏰ Délai expiré. Envoyez votre commande à nouveau.' };
  }
  return { message: `⏳ En attente de paiement...\n${session.stripeCheckoutUrl}` };
}

async function sendWhatsAppMessage(to: string, message: string) {
  if (!process.env.WHATSAPP_TOKEN) { console.warn(`[MOCK WA] To ${to}: ${message}`); return; }
  await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { body: message } }),
  });
}

function parseTimeInput(input: string): Date | null {
  const lower = input.toLowerCase();
  const inMatch = lower.match(/dans\s+(\d+)\s*min/);
  if (inMatch) return new Date(Date.now() + parseInt(inMatch[1]) * 60000);
  const timeMatch = lower.match(/(\d{1,2})[h:](\d{2})?/);
  if (timeMatch) {
    const target = new Date();
    target.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2] || '0'), 0, 0);
    if (target < new Date()) target.setDate(target.getDate() + 1);
    return target;
  }
  return null;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
