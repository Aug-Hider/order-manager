import { db } from '../db';
import { pizzerias, pizzeriaConfigs, staffAccounts, pizzaCategories, pizzas, supplements, desserts } from '../db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  const [pizzeria] = await db.insert(pizzerias).values({
    name: 'Pizza Roma Demo',
    slug: 'pizza-roma',
    whatsappNumber: '+33612345678',
    address: '123 Rue de la Pizza, 75001 Paris',
  }).returning();

  await db.insert(pizzeriaConfigs).values({
    pizzeriaId: pizzeria.id,
    pizzasPerHour: 12,
    averagePizzaTime: 5,
    maxConcurrentPizzas: 4,
  });

  const hashedPassword = await bcrypt.hash('demo123', 12);
  await db.insert(staffAccounts).values([
    { pizzeriaId: pizzeria.id, email: 'chef@pizzaroma.com', passwordHash: hashedPassword, name: 'Chef Mario', role: 'chef' },
    { pizzeriaId: pizzeria.id, email: 'staff@pizzaroma.com', passwordHash: hashedPassword, name: 'Luigi', role: 'staff' },
  ]);

  const [classiques, speciales] = await db.insert(pizzaCategories).values([
    { pizzeriaId: pizzeria.id, name: 'Pizzas Classiques', sortOrder: 1 },
    { pizzeriaId: pizzeria.id, name: 'Pizzas Spéciales', sortOrder: 2 },
  ]).returning();

  await db.insert(pizzas).values([
    { pizzeriaId: pizzeria.id, categoryId: classiques.id, name: 'Margherita', description: 'La classique italienne', ingredients: 'Tomate, mozzarella, basilic', basePrice: '8.50', aiKeywords: ['margherita', 'classique', 'simple'] },
    { pizzeriaId: pizzeria.id, categoryId: classiques.id, name: '4 Fromages', description: 'Mozzarella, chèvre, bleu, parmesan', ingredients: 'Crème, 4 fromages', basePrice: '11.50', aiKeywords: ['4 fromages', 'quatre fromages', 'fromage'] },
    { pizzeriaId: pizzeria.id, categoryId: classiques.id, name: 'Regina', description: 'Jambon et champignons', ingredients: 'Tomate, mozzarella, jambon, champignons', basePrice: '10.50', aiKeywords: ['regina', 'jambon champignons', 'jambon'] },
    { pizzeriaId: pizzeria.id, categoryId: speciales.id, name: 'Calzone', description: 'Pizza chausson maison', ingredients: 'Jambon, champignons, mozzarella, œuf', basePrice: '12.00', aiKeywords: ['calzone', 'chausson'] },
    { pizzeriaId: pizzeria.id, categoryId: speciales.id, name: 'Nduja', description: 'Saucisse épicée calabraise', ingredients: 'Tomate, mozzarella, nduja, poivrons', basePrice: '13.50', aiKeywords: ['nduja', 'épicé', 'pimenté'] },
  ]);

  await db.insert(supplements).values([
    { pizzeriaId: pizzeria.id, name: 'Oignons', price: '1.00', aiKeywords: ['oignons', 'oignon'] },
    { pizzeriaId: pizzeria.id, name: 'Champignons', price: '1.00', aiKeywords: ['champignons', 'champignon'] },
    { pizzeriaId: pizzeria.id, name: 'Anchois', price: '1.50', aiKeywords: ['anchois'] },
    { pizzeriaId: pizzeria.id, name: 'Olives', price: '1.00', aiKeywords: ['olives', 'olive'] },
    { pizzeriaId: pizzeria.id, name: 'Oeuf', price: '1.00', aiKeywords: ['oeuf', 'egg'] },
  ]);

  await db.insert(desserts).values([
    { pizzeriaId: pizzeria.id, name: 'Tiramisu', description: 'Maison, recette italienne', price: '6.50', category: 'dessert', aiKeywords: ['tiramisu', 'tiramisu maison'] },
    { pizzeriaId: pizzeria.id, name: 'Panna Cotta', description: 'Coulis de fruits rouges', price: '5.50', category: 'dessert', aiKeywords: ['panna cotta', 'pannacotta'] },
    { pizzeriaId: pizzeria.id, name: 'Coca-Cola 33cl', description: '', price: '2.50', category: 'drink', aiKeywords: ['coca', 'coca-cola', 'cola'] },
    { pizzeriaId: pizzeria.id, name: 'Eau plate 50cl', description: '', price: '1.50', category: 'drink', aiKeywords: ['eau', 'water'] },
    { pizzeriaId: pizzeria.id, name: 'Salade César', description: 'Romaine, parmesan, croûtons', price: '7.00', category: 'entree', aiKeywords: ['salade', 'cesar', 'césar'] },
  ]);

  console.log('✅ Seeding terminé !');
  console.log('👨‍🍳 Chef: chef@pizzaroma.com / demo123');
  console.log('👤 Staff: staff@pizzaroma.com / demo123');
  console.log('🌐 Menu public: http://localhost:3000/pizza-roma');
  process.exit(0);
}

seed().catch(console.error);
