import { db } from '@/db';
import { pizzerias, pizzas, pizzaCategories, desserts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface PageProps { params: { slug: string } }

export default async function PizzeriaPage({ params }: PageProps) {
  const pizzeria = await db.query.pizzerias.findFirst({
    where: eq(pizzerias.slug, params.slug),
    with: {
      categories: { where: eq(pizzaCategories.isActive, true), orderBy: pizzaCategories.sortOrder },
      pizzas: { where: and(eq(pizzas.isAvailable, true), eq(pizzas.isHidden, false)) },
      desserts: { where: and(eq(desserts.isAvailable, true), eq(desserts.isHidden, false)) },
    },
  });

  if (!pizzeria || !pizzeria.isActive) notFound();

  const pizzasByCategory = pizzeria.categories.map(cat => ({
    ...cat,
    pizzas: pizzeria.pizzas.filter(p => p.categoryId === cat.id),
  })).filter(c => c.pizzas.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-orange-600 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{pizzeria.name}</h1>
          <p className="text-orange-100">📍 {pizzeria.address}</p>
        </div>
      </header>

      <section className="bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Commandez par WhatsApp</h2>
          <a href={`https://wa.me/${pizzeria.whatsappNumber.replace(/[^0-9]/g, '')}`}
            className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-green-600 transition shadow-lg">
            💬 Commander sur WhatsApp
          </a>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Notre Carte</h2>
          {pizzasByCategory.map(category => (
            <div key={category.id} className="mb-12">
              <h3 className="text-2xl font-bold text-orange-600 mb-6 pb-2 border-b-2 border-orange-200">{category.name}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {category.pizzas.map(pizza => (
                  <div key={pizza.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-bold text-gray-900">{pizza.name}</h4>
                      <span className="text-xl font-bold text-orange-600">{pizza.basePrice}€</span>
                    </div>
                    <p className="text-gray-600 mb-2">{pizza.description}</p>
                    {pizza.ingredients && <p className="text-sm text-gray-500 italic">{pizza.ingredients}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {pizzeria.desserts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-pink-600 mb-6 pb-2 border-b-2 border-pink-200">🍨 Desserts & Boissons</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {pizzeria.desserts.map(item => (
                  <div key={item.id} className="bg-white rounded-xl shadow-md p-6 text-center">
                    <h4 className="font-bold text-lg mb-2">{item.name}</h4>
                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                    <span className="text-xl font-bold text-pink-600">{item.price}€</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 px-4 text-center">
        <p>📞 {pizzeria.whatsappNumber}</p>
        <p className="text-gray-400 text-sm mt-2">© {new Date().getFullYear()} {pizzeria.name}</p>
      </footer>
    </div>
  );
}
