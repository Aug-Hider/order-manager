import { db } from '../db';
import { pizzeriaSubscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function generateMonthlyReport() {
  console.log('💰 Rapport facturation mensuel\n');

  const activeSubs = await db.query.pizzeriaSubscriptions.findMany({
    where: eq(pizzeriaSubscriptions.status, 'active'),
    with: { pizzeria: true } as any,
  });

  let totalMRR = 0;
  for (const sub of activeSubs) {
    const mrr = parseFloat(sub.priceMonthly);
    totalMRR += mrr;
    console.log(`  ${(sub as any).pizzeria?.name}: ${mrr}€/mois`);
  }

  console.log(`\nTotal MRR: ${totalMRR.toFixed(2)}€`);
  console.log(`Pizzerias actives: ${activeSubs.length}`);
  process.exit(0);
}

generateMonthlyReport().catch(console.error);
