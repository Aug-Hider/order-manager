'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [pizzeriaName, setPizzeriaName] = useState('');
  const [pizzasPerHour, setPizzasPerHour] = useState(12);
  const [averagePizzaTime, setAveragePizzaTime] = useState(5);
  const [maxConcurrentPizzas, setMaxConcurrentPizzas] = useState(4);
  const [showRetardStats, setShowRetardStats] = useState(false);
  const [email, setEmail] = useState('chef@pizzaroma.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [trustedEmail, setTrustedEmail] = useState<string | null>(null);

  const isChef = session?.user?.role === 'chef';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTrustedEmail(localStorage.getItem('trustedDevice'));
    }
    if (session?.user?.pizzeriaName) {
      setPizzeriaName(session.user.pizzeriaName);
    }
    fetchConfig();
  }, [session]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config');
      const data = await res.json();
      if (data.pizzasPerHour) setPizzasPerHour(data.pizzasPerHour);
      if (data.averagePizzaTime) setAveragePizzaTime(data.averagePizzaTime);
      if (data.maxConcurrentPizzas) setMaxConcurrentPizzas(data.maxConcurrentPizzas);
      if (data.showRetardStats) setShowRetardStats(data.showRetardStats);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleUpdatePizzeria = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pizzeria/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pizzeriaName }),
      });
      const data = await res.json();
      setMessage('✅ Nom de la pizzeria mis à jour');
      
      // Rafraîchir la session pour mettre à jour le nom
      await update({ pizzeriaName });
      router.refresh();
    } catch (error) {
      setMessage('❌ Erreur');
    }
    setLoading(false);
  };

  const handleUpdateConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pizzasPerHour, averagePizzaTime, maxConcurrentPizzas, showRetardStats }),
      });
      const data = await res.json();
      setMessage('✅ Configuration mise à jour');
      router.refresh();
    } catch (error) {
      setMessage('❌ Erreur');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setMessage('✅ Mot de passe réinitialisé');
    } catch (error) {
      setMessage('❌ Erreur');
    }
    setLoading(false);
  };

  const handleRemoveTrust = async () => {
    localStorage.removeItem('trustedDevice');
    setTrustedEmail(null);
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">⚙️ Paramètres</h1>

      {isChef && (
        <>
          <div className="bg-white rounded-xl p-6 max-w-md mb-6">
            <h2 className="text-xl font-semibold mb-4">📝 Nom de la pizzeria</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input value={pizzeriaName} onChange={(e) => setPizzeriaName(e.target.value)} placeholder="Pizza Roma" />
              </div>
              <Button onClick={handleUpdatePizzeria} disabled={loading} className="w-full">
                {loading ? 'En cours...' : 'Mettre à jour'}
              </Button>
              {message && message.includes('pizzeria') && (
                <p className={`text-sm text-center font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 max-w-md mb-6">
            <h2 className="text-xl font-semibold mb-4">👨‍🍳 Configuration Cuisine</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pizzas par heure</label>
                <Input type="number" value={pizzasPerHour} onChange={(e) => setPizzasPerHour(parseInt(e.target.value))} />
                <p className="text-xs text-gray-500 mt-1">Capacité max théorique</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temps moyen par pizza (minutes)</label>
                <Input type="number" value={averagePizzaTime} onChange={(e) => setAveragePizzaTime(parseInt(e.target.value))} />
                <p className="text-xs text-gray-500 mt-1">Temps au four</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pizzas simultanées</label>
                <Input type="number" value={maxConcurrentPizzas} onChange={(e) => setMaxConcurrentPizzas(parseInt(e.target.value))} />
                <p className="text-xs text-gray-500 mt-1">Capacité du four en même temps</p>
              </div>
              <Button onClick={handleUpdateConfig} disabled={loading} className="w-full">
                {loading ? 'En cours...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 max-w-md mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 Stats Retard</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showRetardStats}
                  onChange={(e) => setShowRetardStats(e.target.checked)}
                />
                <span className="text-sm font-medium">Afficher les statistiques de retard</span>
              </label>
              <p className="text-xs text-gray-500">Voir le temps estimé vs temps réel des commandes</p>
              <Button onClick={handleUpdateConfig} disabled={loading} className="w-full">
                {loading ? 'En cours...' : 'Enregistrer'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 max-w-md mb-6">
            <h2 className="text-xl font-semibold mb-4">🔐 Réinitialiser mot de passe</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleResetPassword} disabled={loading} className="w-full">
                {loading ? 'En cours...' : 'Réinitialiser'}
              </Button>
              {message && !message.includes('pizzeria') && !message.includes('Configuration') && (
                <p className={`text-sm text-center font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl p-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Appareil de confiance</h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {trustedEmail ? `Appareil associé à : ${trustedEmail}` : 'Aucun appareil de confiance'}
          </p>
          <Button
            variant="outline"
            onClick={handleRemoveTrust}
            disabled={!trustedEmail}
            className="w-full"
          >
            Dissocier cet appareil
          </Button>
        </div>
      </div>
    </div>
  );
}