import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderLogs } from '@/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';

export async function GET() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
  const toArchive = await db.query.orders.findMany({
    where: and(
      eq(orders.status, 'picked_up'),
      lt(orders.pickedUpAt!, thirtyMinutesAgo),
      isNull(orders.archivedAt)
    ),
  });
  for (const order of toArchive) {
    await db.insert(orderLogs).values({
      pizzeriaId: order.pizzeriaId,
      orderId: order.id,
      orderData: {
        displayNumber: order.displayNumber,
        items: order.items,
        customer: { name: order.customerName, phone: order.customerPhone },
      },
      totalAmount: order.totalAmount,
      preparationMinutes: order.readyAt && order.preparingAt
        ? Math.round((new Date(order.readyAt).getTime() - new Date(order.preparingAt).getTime()) / 60000)
        : null,
    });
    await db.update(orders).set({ archivedAt: new Date() }).where(eq(orders.id, order.id));
  }
  return NextResponse.json({ archived: toArchive.length });
}
