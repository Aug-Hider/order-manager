import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = await db.query.orders.findMany({
    where: eq(orders.pizzeriaId, session.user.pizzeriaId),
    orderBy: desc(orders.createdAt),
    limit: 100,
  });
  return NextResponse.json({ orders: list });
}
