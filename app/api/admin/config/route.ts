import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzeriaConfigs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId || session.user.role !== 'chef')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const config = await db.query.pizzeriaConfigs.findFirst({
    where: eq(pizzeriaConfigs.pizzeriaId, session.user.pizzeriaId),
  });
  return NextResponse.json(config || { pizzasPerHour: 12, averagePizzaTime: 5, maxConcurrentPizzas: 4 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId || session.user.role !== 'chef')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  await db.update(pizzeriaConfigs).set(body).where(eq(pizzeriaConfigs.pizzeriaId, session.user.pizzeriaId));
  return NextResponse.json({ success: true });
}
