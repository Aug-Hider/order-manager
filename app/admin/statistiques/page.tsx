'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TabType = 'benefices' | 'historique' | 'retard';

export default function StatistiquesPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<TabType>('benefices');
  const [loading, setLoading] = useState(true);
  
  // Bénéfices
  const [period, setPeriod] = useState<'jour' | 'semaine' | 'mois'>('jour');
  const [metric, setMetric] = useState<'argent' | 'pizzas'>('argent');
  const [beneficesData, setBeneficesData] = useState<any[]>([]);
  const [beneficesStats, setBeneficesStats] = useState({ total: 0, average: 0, max: 0, topPizzas: [] as any[] });

  // Historique
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');

  // Stats Retard
  const [retardStats, setRetardStats] = useState<any[]>([]);
  const [totalDelayMinutes, setTotalDelayMinutes] = useState(0);
  const [averageDelay, setAverageDelay] = useState(0);
  const [onTimeCount, setOnTimeCount] = useState(0);

  const isChef = session?.user?.role === 'chef';

  useEffect(() => {
    if (tab === 'benefices') fetchBenefices();
    else if (tab === 'historique') fetchOrders();
    else if (tab === 'retard') fetchRetardStats();
  }, [tab, period, metric]);

  const fetchBenefices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/benefices?period=all');
      const result = await res.json();
      const chartData = generateChartData(result, period, metric);
      setBeneficesData(chartData);

      const values = chartData.map((d: any) => d.value);
      const total = values.reduce((a: number, b: number) => a + b, 0);
      const average = values.length > 0 ? total / values.length : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      setBeneficesStats({
        total: metric === 'argent' ? result.totalRevenue : result.totalPizzas,
        average,
        max,
        topPizzas: (result.topPizzas || []).slice(0, 3),
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  const generateChartData = (result: any, period: 'jour' | 'semaine' | 'mois', metric: 'argent' | 'pizzas') => {
    const chartData = [];

    if (period === 'jour') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const label = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
        const value = metric === 'argent' ? Math.round((result.totalRevenue / 7) * 100) / 100 : Math.round(result.totalPizzas / 7);
        chartData.push({ label, value });
      }
    } else if (period === 'semaine') {
      for (let i = 3; i >= 0; i--) {
        const label = `Sem ${4 - i}`;
        const value = metric === 'argent' ? Math.round((result.totalRevenue / 4) * 100) / 100 : Math.round(result.totalPizzas / 4);
        chartData.push({ label, value });
      }
    } else if (period === 'mois') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        const value = metric === 'argent' ? Math.round((result.totalRevenue / 12) * 100) / 100 : Math.round(result.totalPizzas / 12);
        chartData.push({ label, value });
      }
    }

    return chartData;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  const fetchRetardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats-retard');
      const data = await res.json();
      setRetardStats(data.stats || []);

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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Statistiques</h1>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-200">
        <Button
          variant={tab === 'benefices' ? 'default' : 'outline'}
          onClick={() => setTab('benefices')}
          className="mb-2"
        >
          💰 Bénéfices
        </Button>
        <Button
          variant={tab === 'historique' ? 'default' : 'outline'}
          onClick={() => setTab('historique')}
          className="mb-2"
        >
          📦 Historique
        </Button>
        <Button
          variant={tab === 'retard' ? 'default' : 'outline'}
          onClick={() => setTab('retard')}
          className="mb-2"
        >
          ⏱️ Retard
        </Button>
      </div>

      {loading && <div>Chargement...</div>}

      {/* Tab Bénéfices */}
      {!loading && tab === 'benefices' && (
        <div>
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-2">Période</p>
              <div className="flex gap-2">
                {(['jour', 'semaine', 'mois'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod(p)}
                  >
                    {p === 'jour' ? 'Jour' : p === 'semaine' ? 'Semaine' : 'Mois'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-2">Métrique</p>
              <div className="flex gap-2">
                <Button
                  variant={metric === 'argent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetric('argent')}
                >
                  Argent
                </Button>
                <Button
                  variant={metric === 'pizzas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetric('pizzas')}
                >
                  Pizzas
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold">{metric === 'argent' ? beneficesStats.total.toFixed(2) + ' EUR' : beneficesStats.total + ' pizzas'}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Moyenne</p>
              <p className="text-3xl font-bold">{metric === 'argent' ? beneficesStats.average.toFixed(2) + ' EUR' : Math.round(beneficesStats.average) + ' pizzas'}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Maximum</p>
              <p className="text-3xl font-bold">{metric === 'argent' ? beneficesStats.max.toFixed(2) + ' EUR' : beneficesStats.max + ' pizzas'}</p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            {beneficesData.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={beneficesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#f97316" name={metric === 'argent' ? 'EUR' : 'Pizzas'} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {metric === 'pizzas' && beneficesStats.topPizzas.length > 0 && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">🏆 Top 3 Pizzas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {beneficesStats.topPizzas.map((pizza: any, index: number) => (
                  <div key={pizza.name} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-300">
                    <p className="text-2xl mb-2">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</p>
                    <h3 className="font-bold text-lg">{pizza.name}</h3>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{pizza.count} pizzas</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab Historique */}
      {!loading && tab === 'historique' && (
        <div>
          <div className="mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Toutes les commandes</option>
              <option value="paid">Payées</option>
              <option value="preparing">En cours</option>
              <option value="ready">Prêtes</option>
              <option value="picked_up">Parties</option>
            </select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {orders
              .filter((o) => !filterStatus || o.status === filterStatus)
              .map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">Commande #{order.displayNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName} - {order.customerPhone}</p>
                      <p className="text-sm">{order.totalPizzas} 🍕</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">{order.totalAmount}€</p>
                      <p className="text-sm capitalize">{order.status}</p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Tab Retard */}
      {!loading && tab === 'retard' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 border-2 border-red-200">
              <p className="text-sm text-gray-600 mb-1">⏰ Temps Total Perdu</p>
              <p className="text-4xl font-bold text-red-600">{totalDelayMinutes}</p>
              <p className="text-xs text-gray-500 mt-1">minutes</p>
            </Card>
            <Card className="p-6 border-2 border-orange-200">
              <p className="text-sm text-gray-600 mb-1">📊 Retard Moyen</p>
              <p className="text-4xl font-bold text-orange-600">{averageDelay}</p>
              <p className="text-xs text-gray-500 mt-1">minutes</p>
            </Card>
            <Card className="p-6 border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-1">✅ À l'Heure</p>
              <p className="text-4xl font-bold text-green-600">{onTimeCount}</p>
              <p className="text-xs text-gray-500 mt-1">commandes</p>
            </Card>
            <Card className="p-6 border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-1">📦 Total</p>
              <p className="text-4xl font-bold text-blue-600">{retardStats.length}</p>
              <p className="text-xs text-gray-500 mt-1">commandes</p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {retardStats.map((stat, i) => {
                const delay = stat.delayMinutes || 0;
                const isLate = delay > 0;
                return (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${isLate ? 'bg-red-50' : 'bg-green-50'}`}>
                    <div>
                      <p className="font-semibold">Commande #{stat.displayNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(stat.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className={`text-right ${isLate ? 'text-red-600' : 'text-green-600'}`}>
                      <p className="font-bold">{Math.abs(delay)} min {isLate ? 'retard' : 'avance'}</p>
                      <p className="text-sm">Prep: {stat.preparationMinutes || 0} min</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}