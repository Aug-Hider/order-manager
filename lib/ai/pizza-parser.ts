import Groq from 'groq-sdk';

// Groq est 100% gratuit — créer un compte sur https://console.groq.com
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface ParsedOrderItem {
  type: 'pizza' | 'dessert' | 'drink';
  name: string;
  quantity: number;
  supplements?: string[];
}

// ─── Parsing IA avec Groq (gratuit) ──────────────────────────────────────────

export async function parseOrderIntent(
  message: string,
  availablePizzas: any[],
  availableSupplements: any[],
  availableDesserts: any[]
): Promise<{ items: ParsedOrderItem[]; isOrderIntent: boolean }> {

  const systemPrompt = `Tu es un assistant pizzeria. Analyse ce message client et réponds UNIQUEMENT en JSON valide, sans texte avant ou après.

PIZZAS DISPONIBLES: ${availablePizzas.map(p => `"${p.name}" (mots-clés: ${(p.aiKeywords as string[]).join(', ')})`).join(' | ')}
SUPPLÉMENTS: ${availableSupplements.map(s => `"${s.name}" (mots-clés: ${(s.aiKeywords as string[]).join(', ')})`).join(' | ')}
DESSERTS/BOISSONS: ${availableDesserts.map(d => `"${d.name}" (mots-clés: ${(d.aiKeywords as string[]).join(', ')})`).join(' | ')}

RÈGLES:
- Détecte si c'est une intention de commande (pizza, commander, faim, menu, etc.)
- Parse les quantités: "une"=1, "deux"=2, "2x"=2, "trois"=3, etc.
- Associe chaque article au nom exact disponible
- Inclus les suppléments mentionnés

FORMAT JSON REQUIS (rien d'autre):
{"isOrderIntent": true, "items": [{"type": "pizza", "name": "Nom exact", "quantity": 1, "supplements": ["Nom supp"]}, {"type": "dessert", "name": "Nom exact", "quantity": 1}]}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192', // Gratuit, rapide, suffisant pour ce cas
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.1, // Peu de créativité = résultats plus stables
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse');

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn('Groq API error, fallback regex:', error);
    // Fallback regex si l'API Groq est indisponible
    return fallbackParser(message, availablePizzas, availableDesserts);
  }
}

// ─── Fallback sans API (regex + matching flou) ────────────────────────────────

function fallbackParser(
  message: string,
  availablePizzas: any[],
  availableDesserts: any[]
): { items: ParsedOrderItem[]; isOrderIntent: boolean } {
  const lower = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Détection intention commande
  const orderKeywords = ['pizza', 'commander', 'commande', 'veux', 'voudrais', 'prendre', 'menu', 'faim'];
  const isOrderIntent = orderKeywords.some(k => lower.includes(k));

  if (!isOrderIntent) return { items: [], isOrderIntent: false };

  const items: ParsedOrderItem[] = [];

  // Parser la quantité avant un mot
  const parseQty = (text: string, idx: number): number => {
    const before = text.substring(Math.max(0, idx - 20), idx).trim();
    const numberWords: Record<string, number> = { 'une': 1, 'un': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5 };
    const numMatch = before.match(/(\d+)x?\s*$/) || before.match(/x(\d+)\s*$/);
    if (numMatch) return parseInt(numMatch[1]);
    for (const [word, num] of Object.entries(numberWords)) {
      if (before.endsWith(word) || before.includes(`${word} `)) return num;
    }
    return 1;
  };

  // Chercher chaque pizza dans le message
  for (const pizza of availablePizzas) {
    const keywords = (pizza.aiKeywords as string[]).map(k =>
      k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    for (const kw of keywords) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        items.push({ type: 'pizza', name: pizza.name, quantity: parseQty(lower, idx), supplements: [] });
        break;
      }
    }
  }

  // Chercher chaque dessert/boisson
  for (const dessert of availableDesserts) {
    const keywords = (dessert.aiKeywords as string[]).map(k =>
      k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    for (const kw of keywords) {
      const idx = lower.indexOf(kw);
      if (idx !== -1) {
        const type = dessert.category === 'drink' ? 'drink' : 'dessert';
        items.push({ type, name: dessert.name, quantity: parseQty(lower, idx) });
        break;
      }
    }
  }

  return { items, isOrderIntent: items.length > 0 || isOrderIntent };
}

// ─── Calcul disponibilité four ────────────────────────────────────────────────

export async function calculateAvailability(
  pizzeriaId: string,
  requestedTime: Date,
  totalPizzas: number,
  config: { pizzasPerHour: number; averagePizzaTime: number; maxConcurrentPizzas: number },
  existingOrders: any[] = []
): Promise<{ available: boolean; estimatedReadyTime: Date; reason?: string }> {

  const pizzasInProgress = existingOrders
    .filter(o => ['paid', 'preparing'].includes(o.status))
    .reduce((sum, o) => sum + (o.totalPizzas || 0), 0);

  if (config.maxConcurrentPizzas - pizzasInProgress <= 0) {
    return {
      available: false,
      estimatedReadyTime: new Date(requestedTime.getTime() + 30 * 60000),
      reason: 'Four complet sur ce créneau, proposez +30 minutes',
    };
  }

  const batchesNeeded = Math.ceil(totalPizzas / config.maxConcurrentPizzas);
  const prepMinutes = batchesNeeded * config.averagePizzaTime;
  const estimatedReady = new Date(requestedTime.getTime() + prepMinutes * 60000);

  return { available: true, estimatedReadyTime: estimatedReady };
}
