import { Draggable } from '@hello-pangea/dnd';

interface Order { id: string; displayNumber: number; items: any[]; totalPizzas: number; estimatedReadyTime: string }
interface KanbanCardProps { order: Order; index: number }

export function KanbanCard({ order, index }: KanbanCardProps) {
  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          className={`mb-3 p-4 bg-white rounded-lg shadow-md border-l-4 border-orange-500 ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-400' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold">#{order.displayNumber}</span>
            <span className="text-sm text-gray-500">{order.totalPizzas} 🍕</span>
          </div>
          <div className="space-y-1 mb-2">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="text-sm">
                <span className="font-semibold">{item.quantity}x {item.name}</span>
                {item.supplements?.length > 0 && <span className="text-gray-500"> +{item.supplements.map((s: any) => s.name).join(', ')}</span>}
              </div>
            ))}
          </div>
          <div className="text-xs font-bold text-green-600">
            {new Date(order.estimatedReadyTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}
    </Draggable>
  );
}
