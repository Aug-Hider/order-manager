'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PeriodType = 'jour' | 'semaine' | 'mois';
type MetricType = 'argent' | 'pizzas';

export default function BeneficesPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<PeriodType>('jour');
  const [metric, setMetric] = useState<MetricType>('argent');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    average: 0, 
    max: 0, 
    topPizzas: [] as any[] 
  });

  useEffect(() => {
    fetchBenefices();
  }, [period, metric]);

  const fetchBenefices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/benefices?period=all');
      const result = await res.json();

      const chartData = generateChartData(result, period, metric);
      setData(chartData);

      const values = chartData.map((d: any) => d.value);
      const total = values.reduce((a: number, b: number) => a + b, 0);
      const average = values.length > 0 ? total / values.length : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      setStats({
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

  const generateChartData = (result: any, period: PeriodType, metric: MetricType) => {
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

  if (loading) return <div className="p-8">Chargement...</div>;

  const yAxisLabel = metric === 'argent' ? 'EUR' : 'Pizzas';
  const title = metric === 'argent' ? '💰 Chiffre d\'affaires' : '🍕 Nombre de pizzas';

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Periode</p>
          <div className="flex gap-2">
            <Button
              variant={period === 'jour' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('jour')}
            >
              Jour
            </Button>
            <Button
              variant={period === 'semaine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('semaine')}
            >
              Semaine
            </Button>
            <Button
              variant={period === 'mois' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('mois')}
            >
              Mois
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Metrique</p>
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
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-3xl font-bold">
            {metric === 'argent' ? stats.total.toFixed(2) + ' EUR' : stats.total + ' pizzas'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Moyenne</p>
          <p className="text-3xl font-bold">
            {metric === 'argent' ? stats.average.toFixed(2) + ' EUR' : Math.round(stats.average) + ' pizzas'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Maximum</p>
          <p className="text-3xl font-bold">
            {metric === 'argent' ? stats.max.toFixed(2) + ' EUR' : stats.max + ' pizzas'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f97316"
                name={metric === 'argent' ? 'Chiffre affaires EUR' : 'Pizzas vendues'}
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-gray-500">Aucune donnee</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">🏆 Top 3 Pizzas les Plus Commandees</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.topPizzas && stats.topPizzas.length > 0 ? (
            stats.topPizzas.map((pizza: any, index: number) => (
              <div key={pizza.name} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                </div>
                <h3 className="font-bold text-xl mb-2">{pizza.name}</h3>
                <p className="text-4xl font-bold text-orange-600">{pizza.count}</p>
                <p className="text-sm text-gray-600 mt-2">pizzas commandees</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 col-span-full">Aucune donnee disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}