'use client';
import { useEffect, useState } from 'react';
interface Order { id: string; displayNumber: number; customerName: string; customerPhone: string; totalAmount: number; status: string; createdAt: string; items: any[] }
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { fetch('/api/admin/orders').then(r => r.json()).then(d => setOrders(d.orders)); }, []);
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">📦 Historique des commandes</h1>
      <div className="flex gap-2 mb-6">
        {['all', 'paid', 'preparing', 'ready', 'picked_up'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg capitalize ${filter === f ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {f === 'all' ? 'Toutes' : f.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{['N°','Client','Articles','Total','Statut','Date'].map(h=><th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">#{order.displayNumber}</td>
                <td className="px-6 py-4"><div>{order.customerName||'Anonyme'}</div><div className="text-sm text-gray-500">{order.customerPhone}</div></td>
                <td className="px-6 py-4">{order.items.map((item:any,i:number)=><div key={i} className="text-sm">{item.quantity}x {item.name}</div>)}</td>
                <td className="px-6 py-4 font-bold">{order.totalAmount}€</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">{order.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
