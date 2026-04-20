import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = await db.query.orders.findMany({
    where: and(
      eq(orders.pizzeriaId, session.user.pizzeriaId),
      inArray(orders.status, ['paid', 'preparing', 'ready', 'picked_up'])
    ),
  });
  return NextResponse.json({ orders: list });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { orderId, status } = await req.json();
  const updates: any = { status, updatedAt: new Date() };
  if (status === 'preparing') updates.preparingAt = new Date();
  if (status === 'ready') updates.readyAt = new Date();
  if (status === 'picked_up') updates.pickedUpAt = new Date();
  await db.update(orders).set(updates).where(eq(orders.id, orderId));
  return NextResponse.json({ success: true });
}
