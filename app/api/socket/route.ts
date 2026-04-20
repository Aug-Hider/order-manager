import { NextResponse } from 'next/server';
import { Server } from 'socket.io';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;
    io.on('connection', (socket) => {
      socket.on('join-kitchen', (pizzeriaId: string) => socket.join(`kitchen-${pizzeriaId}`));
      socket.on('update-order-status', async ({ orderId, status, pizzeriaId }) => {
        const updates: any = { status, updatedAt: new Date() };
        if (status === 'preparing') updates.preparingAt = new Date();
        if (status === 'ready') updates.readyAt = new Date();
        if (status === 'picked_up') updates.pickedUpAt = new Date();
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
  }
  res.end();
};
export { ioHandler as GET, ioHandler as POST };
