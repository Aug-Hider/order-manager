'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Order { id: string; displayNumber: number; items: Array<{ name: string; quantity: number; supplements?: string[] }>; totalPizzas: number; estimatedReadyTime: string; status: 'paid'|'preparing'|'ready'|'picked_up'; createdAt: string }
const COLUMNS = { paid: { title: '🔥 Nouvelles', color: 'bg-orange-100 border-orange-300' }, preparing: { title: '👨‍🍳 En cours', color: 'bg-blue-100 border-blue-300' }, ready: { title: '✅ Prêtes', color: 'bg-green-100 border-green-300' }, picked_up: { title: '📦 Parties', color: 'bg-gray-100 border-gray-300' } };

export default function KitchenDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    const fetchOrders = () => fetch('/api/kitchen/orders').then(r=>r.json()).then(d=>setOrders(d.orders));
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Order['status'];
    setOrders(prev => prev.map(o => o.id === draggableId ? { ...o, status: newStatus } : o));
    await fetch(`/api/kitchen/orders/${draggableId}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus }) });
  };

  const getColumnOrders = (s: Order['status']) => orders.filter(o => o.status === s).sort((a,b) => new Date(a.estimatedReadyTime).getTime() - new Date(b.estimatedReadyTime).getTime());

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-gray-900">👨‍🍳 Cuisine</h1><p className="text-gray-600">{session?.user?.pizzeriaName}</p></div>
        <button onClick={() => router.push('/admin/dashboard')} className="px-4 py-2 bg-gray-800 text-white rounded-lg">← Admin</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4 h-[calc(100vh-140px)]">
          {Object.entries(COLUMNS).map(([status, cfg]) => (
            <div key={status} className="flex flex-col">
              <div className={`p-3 rounded-t-lg font-bold text-center ${cfg.color}`}>
                {cfg.title} <span className="ml-2 bg-white px-2 py-1 rounded-full text-sm">{getColumnOrders(status as Order['status']).length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 ${cfg.color} rounded-b-lg p-2 overflow-y-auto`}>
                    {getColumnOrders(status as Order['status']).map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-3 p-4 bg-white rounded-lg shadow-md border-l-4 border-orange-500">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-3xl font-bold">#{order.displayNumber}</span>
                              <span className="text-sm text-gray-500">{order.totalPizzas} 🍕</span>
                            </div>
                            <div className="space-y-1 mb-3">
                              {order.items.map((item, i) => (
                                <div key={i} className="text-sm"><span className="font-semibold">{item.quantity}x {item.name}</span>{item.supplements?.length ? <span className="text-gray-500"> +{item.supplements.join(', ')}</span> : null}</div>
                              ))}
                            </div>
                            <div className="text-xs font-bold text-green-600">{new Date(order.estimatedReadyTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
