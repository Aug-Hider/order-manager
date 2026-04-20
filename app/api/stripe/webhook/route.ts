import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { whatsappSessions, orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const wSessionId = session.metadata?.whatsapp_session_id;
    if (!wSessionId) return NextResponse.json({ ok: true });

    const wSession = await db.query.whatsappSessions.findFirst({ where: eq(whatsappSessions.id, wSessionId) });
    if (!wSession || wSession.status === 'completed') return NextResponse.json({ ok: true });

    const weekYear = getWeekYear();
    const result = await db.execute(`SELECT generate_display_number($1, $2) as num`, [wSession.pizzeriaId, weekYear]);
    const displayNumber = (result as any)[0].num;
    const totalPizzas = (wSession.cartItems as any[]).reduce((sum, item) => sum + (item.type === 'pizza' ? item.quantity : 0), 0);

    await db.insert(orders).values({
      pizzeriaId: wSession.pizzeriaId, displayNumber, weekYear,
      customerPhone: wSession.customerPhone, items: wSession.cartItems,
      totalAmount: wSession.totalAmount!, requestedTime: wSession.requestedTime,
      estimatedReadyTime: wSession.estimatedReadyTime, status: 'paid', paidAt: new Date(),
      stripePaymentIntentId: session.payment_intent as string, totalPizzas,
    });

    await db.update(whatsappSessions)
      .set({ status: 'completed', currentStep: 'completed' })
      .where(eq(whatsappSessions.id, wSessionId));
  }

  return NextResponse.json({ received: true });
}

function getWeekYear(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime() + ((start.getDay() + 1) * 86400000);
  return `${now.getFullYear()}-W${Math.ceil(diff / 604800000)}`;
}
