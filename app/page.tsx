import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-orange-600 text-white">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🍕 PizzaOS</h1>
          <div className="space-x-4">
            <Link href="/login" className="hover:text-orange-200">Connexion</Link>
            <Link href="#demo" className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-orange-50">
              Voir démo
            </Link>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">Votre pizzeria sur WhatsApp</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Commandes automatisées, paiement intégré, dashboard cuisine temps réel. Zéro commission, 100% contrôle.
          </p>
          <Link href="#contact" className="inline-block bg-white text-orange-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-orange-50 transition">
            Démarrer gratuitement
          </Link>
        </div>
      </header>

      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '💬', color: 'green', title: 'WhatsApp Natif', desc: "Vos clients commandent comme ils parlent. Pas d'app à télécharger." },
            { icon: '💳', color: 'blue', title: 'Paiement Sécurisé', desc: "Stripe intégré. L'argent arrive directement sur votre compte." },
            { icon: '👨‍🍳', color: 'orange', title: 'Cuisine Optimisée', desc: 'Dashboard Kanban temps réel. Glisser-déposer, c\'est prêt.' },
          ].map((f) => (
            <div key={f.title} className="text-center p-6">
              <div className={`w-16 h-16 bg-${f.color}-100 text-${f.color}-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4`}>{f.icon}</div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} PizzaOS - Toutes les pizzerias méritent leur tech</p>
        </div>
      </footer>
    </div>
  );
}
