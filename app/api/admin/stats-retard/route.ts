import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orderLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const logs = await db.query.orderLogs.findMany({
      where: eq(orderLogs.pizzeriaId, session.user.pizzeriaId),
    });

    const stats = logs.map((log: any) => ({
      displayNumber: log.orderData?.displayNumber || '?',
      delayMinutes: log.delayMinutes || 0,
      preparationMinutes: log.preparationMinutes || 0,
      createdAt: log.archivedAt,
    }));

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ stats: [] });
  }
}