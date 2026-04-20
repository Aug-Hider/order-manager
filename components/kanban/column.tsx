import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './card';

interface Order { id: string; displayNumber: number; status: string; items: any[]; totalPizzas: number; estimatedReadyTime: string }
interface ColumnProps { status: string; title: string; color: string; orders: Order[] }

export function Column({ status, title, color, orders }: ColumnProps) {
  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 rounded-t-lg font-bold text-center ${color} border-b-2`}>
        {title} <span className="ml-2 bg-white px-2 py-1 rounded-full text-sm">{orders.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            className={`flex-1 ${color} rounded-b-lg p-2 overflow-y-auto ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : ''}`}>
            {orders.map((order, index) => <KanbanCard key={order.id} order={order} index={index} />)}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
