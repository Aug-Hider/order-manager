import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId || session.user.role !== 'chef')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const period = new URL(req.url).searchParams.get('period') || 'week';
  const startDate = new Date();
  if (period === 'week') startDate.setDate(startDate.getDate() - 7);
  else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
  else startDate.setFullYear(startDate.getFullYear() - 1);

  const list = await db.query.orders.findMany({
    where: and(eq(orders.pizzeriaId, session.user.pizzeriaId), gte(orders.createdAt, startDate)),
  });

  const totalRevenue = list.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
  const totalOrders = list.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalPizzas = list.reduce((sum, o) => sum + o.totalPizzas, 0);

  const pizzaCounts: Record<string, { count: number; revenue: number }> = {};
  list.forEach(order => {
    (order.items as any[]).forEach((item: any) => {
      if (item.type === 'pizza') {
        if (!pizzaCounts[item.name]) pizzaCounts[item.name] = { count: 0, revenue: 0 };
        pizzaCounts[item.name].count += item.quantity;
        pizzaCounts[item.name].revenue += item.subtotal;
      }
    });
  });

  const topPizzas = Object.entries(pizzaCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({ totalRevenue, totalOrders, averageOrderValue, totalPizzas, topPizzas });
}
