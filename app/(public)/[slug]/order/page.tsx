import { db } from '@/db';
import { pizzerias } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface PageProps { params: { slug: string } }

export default async function OrderPage({ params }: PageProps) {
  const pizzeria = await db.query.pizzerias.findFirst({ where: eq(pizzerias.slug, params.slug) });
  if (!pizzeria) notFound();

  const steps = [
    { icon: '💬', title: 'Ouvrez WhatsApp', desc: 'Cliquez sur le bouton ci-dessous' },
    { icon: '🍕', title: 'Envoyez votre commande', desc: '"2 pizzas 4 fromages + oignons, 1 tiramisu"' },
    { icon: '⏰', title: "Choisissez l'heure", desc: "L'IA vérifie les créneaux et propose un horaire" },
    { icon: '💳', title: 'Payez en ligne', desc: 'Lien de paiement sécurisé Stripe envoyé par WhatsApp' },
    { icon: '🎫', title: 'Retirez avec votre numéro', desc: 'Vous recevez un numéro (#42). Présentez-le au retrait !' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Comment commander ?</h1>
        <p className="text-center text-gray-600 mb-8">{pizzeria.name}</p>
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl shrink-0">{step.icon}</div>
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href={`https://wa.me/${pizzeria.whatsappNumber.replace(/[^0-9]/g, '')}`}
            className="inline-flex items-center gap-3 bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold hover:bg-green-600 transition w-full justify-center">
            💬 Commander maintenant
          </a>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800"><strong>💡 Astuce :</strong> L&apos;IA comprend le langage naturel — pas besoin de syntaxe exacte !</p>
        </div>
      </div>
    </div>
  );
}
