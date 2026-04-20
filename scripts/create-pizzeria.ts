import { db } from '../db';
import { pizzerias, pizzeriaConfigs, staffAccounts, pizzaCategories } from '../db/schema';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

async function createPizzeria() {
  console.log('🍕 Création d\'une nouvelle pizzeria\n');

  const name = await question('Nom de la pizzeria: ');
  const slug = await question('Slug URL (ex: pizza-roma): ');
  const whatsappNumber = await question('Numéro WhatsApp (+33...): ');
  const address = await question('Adresse: ');
  const chefEmail = await question('Email du chef: ');
  const chefName = await question('Nom du chef: ');
  const tempPassword = Math.random().toString(36).slice(-8);

  console.log('\n--- Récapitulatif ---');
  console.log(`Pizzeria: ${name}`);
  console.log(`URL publique: https://votre-domaine.com/${slug}`);
  console.log(`Chef: ${chefEmail}`);
  console.log(`Mot de passe temporaire: ${tempPassword}`);

  const confirm = await question('\nCréer ? (oui/non): ');
  if (confirm.toLowerCase() !== 'oui') { console.log('Annulé.'); process.exit(0); }

  const [pizzeria] = await db.insert(pizzerias).values({ name, slug, whatsappNumber, address }).returning();

  await db.insert(pizzeriaConfigs).values({
    pizzeriaId: pizzeria.id,
    pizzasPerHour: 12,
    averagePizzaTime: 5,
    maxConcurrentPizzas: 4,
  });

  await db.insert(staffAccounts).values({
    pizzeriaId: pizzeria.id,
    email: chefEmail,
    passwordHash: await bcrypt.hash(tempPassword, 12),
    name: chefName,
    role: 'chef',
  });

  await db.insert(pizzaCategories).values([
    { pizzeriaId: pizzeria.id, name: 'Pizzas Classiques', sortOrder: 1 },
    { pizzeriaId: pizzeria.id, name: 'Pizzas Spéciales', sortOrder: 2 },
  ]);

  console.log('\n✅ Pizzeria créée avec succès !');
  console.log('👉 Connectez-vous et ajoutez vos pizzas dans le dashboard.');
  rl.close();
  process.exit(0);
}

createPizzeria().catch(console.error);
