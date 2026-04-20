'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export default function StatsRetardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDelayMinutes, setTotalDelayMinutes] = useState(0);
  const [averageDelay, setAverageDelay] = useState(0);
  const [onTimeCount, setOnTimeCount] = useState(0);

  const isChef = session?.user?.role === 'chef';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats-retard');
      const data = await res.json();
      setStats(data.stats || []);

      if (data.stats && data.stats.length > 0) {
        const totalDelay = data.stats.reduce((sum: number, s: any) => sum + Math.max(0, s.delayMinutes || 0), 0);
        const onTime = data.stats.filter((s: any) => (s.delayMinutes || 0) <= 0).length;
        const avgDelay = totalDelay / data.stats.length;

        setTotalDelayMinutes(totalDelay);
        setAverageDelay(Math.round(avgDelay));
        setOnTimeCount(onTime);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  if (!isChef) return <div className="p-8">Accès refusé</div>;
  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">⏱️ Statistiques de Retard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-6 border-2 border-red-200">
          <p className="text-sm text-gray-600 mb-1">⏰ Temps Total Perdu</p>
          <p className="text-4xl font-bold text-red-600">{totalDelayMinutes}</p>
          <p className="text-xs text-gray-500 mt-1">minutes</p>
        </Card>
        <Card className="p-6 border-2 border-orange-200">
          <p className="text-sm text-gray-600 mb-1">📊 Retard Moyen</p>
          <p className="text-4xl font-bold text-orange-600">{averageDelay}</p>
          <p className="text-xs text-gray-500 mt-1">minutes par commande</p>
        </Card>
        <Card className="p-6 border-2 border-green-200">
          <p className="text-sm text-gray-600 mb-1">✅ À l'Heure</p>
          <p className="text-4xl font-bold text-green-600">{onTimeCount}</p>
          <p className="text-xs text-gray-500 mt-1">commandes</p>
        </Card>
        <Card className="p-6 border-2 border-blue-200">
          <p className="text-sm text-gray-600 mb-1">📦 Total Analysées</p>
          <p className="text-4xl font-bold text-blue-600">{stats.length}</p>
          <p className="text-xs text-gray-500 mt-1">commandes</p>
        </Card>
      </div>

      <div className="bg-white rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Détail des Commandes</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {stats.map((stat, i) => {
            const delay = stat.delayMinutes || 0;
            const isLate = delay > 0;
            return (
              <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${isLate ? 'bg-red-50' : 'bg-green-50'}`}>
                <div>
                  <p className="font-semibold">Commande #{stat.displayNumber}</p>
                  <p className="text-sm text-gray-500">{new Date(stat.createdAt).toLocaleString('fr-FR')}</p>
                </div>
                <div className={`text-right ${isLate ? 'text-red-600' : 'text-green-600'}`}>
                  <p className="font-bold">{Math.abs(delay)} min {isLate ? 'de retard' : 'en avance'}</p>
                  <p className="text-sm">Préparation: {stat.preparationMinutes || 0} min</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}