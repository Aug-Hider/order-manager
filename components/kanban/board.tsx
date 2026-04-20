'use client';

import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const COLUMNS = [
  { id: 'pending_payment', label: 'Nouvelles', color: 'bg-blue-50' },
  { id: 'paid', label: 'En attente', color: 'bg-yellow-50' },
  { id: 'preparing', label: 'En cours', color: 'bg-orange-50' },
  { id: 'ready', label: 'Prêtes', color: 'bg-green-50' },
  { id: 'picked_up', label: 'Parties', color: 'bg-gray-50' },
];

export function KanbanBoard({
  orders,
  onDragEnd,
}: {
  orders: any[];
  onDragEnd: (result: DropResult) => void;
}) {
  const [readyTimes, setReadyTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    calculateReadyTimes();
  }, [orders]);

  const calculateReadyTimes = async () => {
    const times: Record<string, string> = {};

    for (const order of orders) {
      if (order.status === 'paid' || order.status === 'preparing') {
        try {
          const res = await fetch('/api/admin/calculate-ready-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ totalPizzas: order.totalPizzas }),
          });
          const data = await res.json();
          const readyTime = new Date(data.optimizedReadyTime || data.estimatedReadyTime);
          times[order.id] = readyTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
          console.error('Erreur calcul:', error);
        }
      }
    }

    setReadyTimes(times);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-5 gap-4 h-full">
        {COLUMNS.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`rounded-lg p-4 min-h-[600px] ${column.color} border-2 ${
                  snapshot.isDraggingOver ? 'border-orange-400' : 'border-gray-200'
                }`}
              >
                <h3 className="font-bold text-lg mb-4">{column.label}</h3>
                <div className="space-y-3">
                  {orders
                    .filter((o) => o.status === column.id)
                    .map((order, index) => (
                      <Draggable key={order.id} draggableId={order.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg p-3 border-2 cursor-move ${
                              snapshot.isDragging ? 'border-orange-500 shadow-lg' : 'border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-lg">#{order.displayNumber}</span>
                              {readyTimes[order.id] && (
                                <span className="text-sm bg-orange-100 text-orange-700 px-2 py-1 rounded font-semibold">
                                  ⏰ {readyTimes[order.id]}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium">{order.customerName}</p>
                            <p className="text-xs text-gray-600">{order.customerPhone}</p>
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-sm">{order.totalPizzas} 🍕</p>
                              <p className="font-semibold text-orange-600">{order.totalAmount}€</p>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}