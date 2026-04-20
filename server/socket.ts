import { Server } from 'socket.io';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function setupWebSocket(server: any) {
  const io = new Server(server, { path: '/api/socket', cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join-kitchen', (pizzeriaId: string) => socket.join(`kitchen-${pizzeriaId}`));

    socket.on('update-order-status', async ({ orderId, status, pizzeriaId }) => {
      const now = new Date();
      const updates: any = { status, updatedAt: now };
      if (status === 'preparing') updates.preparingAt = now;
      if (status === 'ready') updates.readyAt = now;
      if (status === 'picked_up') updates.pickedUpAt = now;

      await db.update(orders).set(updates).where(eq(orders.id, orderId));
      io.to(`kitchen-${pizzeriaId}`).emit('order-updated', { id: orderId, status, ...updates });

      if (status === 'picked_up') {
        setTimeout(async () => {
          await db.update(orders).set({ archivedAt: new Date() }).where(eq(orders.id, orderId));
          io.to(`kitchen-${pizzeriaId}`).emit('order-archived', orderId);
        }, 30 * 60000);
      }
    });
  });

  return io;
}
