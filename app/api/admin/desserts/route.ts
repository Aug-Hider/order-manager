import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { desserts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await db.query.desserts.findMany({ where: eq(desserts.pizzeriaId, session.user.pizzeriaId) }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const [item] = await db.insert(desserts).values({ pizzeriaId: session.user.pizzeriaId, ...body }).returning();
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  await db.update(desserts).set(body).where(eq(desserts.id, body.id));
  return NextResponse.json({ success: true });
}
