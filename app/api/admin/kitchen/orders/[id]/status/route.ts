import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json();

  const validStatuses = ['paid', 'preparing', 'ready', 'picked_up', 'cancelled'];
  if (!validStatuses.includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const updates: any = { status, updatedAt: new Date() };
  if (status === 'preparing') updates.preparingAt = new Date();
  if (status === 'ready') updates.readyAt = new Date();
  if (status === 'picked_up') updates.pickedUpAt = new Date();

  await db.update(orders)
    .set(updates)
    .where(eq(orders.id, params.id));

  return NextResponse.json({ success: true, status });
}
