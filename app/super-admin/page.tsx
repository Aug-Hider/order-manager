'use client';
import { useEffect, useState } from 'react';
interface Pizzeria { id: string; name: string; slug: string; whatsappNumber: string; isActive: boolean; createdAt: string; _count?: { orders: number } }
export default function SuperAdminPage() {
  const [pizzerias, setPizzerias] = useState<Pizzeria[]>([]);
  useEffect(() => { fetch('/api/super-admin/pizzerias').then(r=>r.json()).then(d=>setPizzerias(d.pizzerias)); }, []);
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">👑 Super Admin - PizzaOS</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-gray-500 text-sm">Pizzerias actives</p><p className="text-3xl font-bold text-blue-600">{pizzerias.length}</p></div>
        <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-gray-500 text-sm">MRR Total</p><p className="text-3xl font-bold text-green-600">{(pizzerias.length * 79).toFixed(0)}€</p></div>
        <div className="bg-white p-6 rounded-xl shadow-sm"><p className="text-gray-500 text-sm">Commandes ce mois</p><p className="text-3xl font-bold text-orange-600">{pizzerias.reduce((sum, p) => sum + (p._count?.orders || 0), 0)}</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{['Pizzeria','Slug','WhatsApp','Statut','Créée le'].map(h=><th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-200">
            {pizzerias.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{p.name}</td>
                <td className="px-6 py-4 text-sm">{p.slug}</td>
                <td className="px-6 py-4 text-sm">{p.whatsappNumber}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
