import { NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzerias, orders } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  // Super admin check — dans un vrai projet, ajoute un rôle 'super_admin' en DB
  if (!session?.user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allPizzerias = await db.query.pizzerias.findMany({
    orderBy: pizzerias.createdAt,
  });

  // Compte les commandes du mois pour chaque pizzeria
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const pizzeriasWithStats = await Promise.all(
    allPizzerias.map(async (p) => {
      const monthOrders = await db.query.orders.findMany({
        where: eq(orders.pizzeriaId, p.id),
      });
      const monthRevenue = monthOrders
        .filter(o => new Date(o.createdAt) >= monthStart)
        .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

      return {
        ...p,
        _count: { orders: monthOrders.filter(o => new Date(o.createdAt) >= monthStart).length },
        monthRevenue,
      };
    })
  );

  const totalRevenue = pizzeriasWithStats.reduce((sum, p) => sum + p.monthRevenue, 0);

  return NextResponse.json({
    pizzerias: pizzeriasWithStats,
    totalRevenue,
  });
}
