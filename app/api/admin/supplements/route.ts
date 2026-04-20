import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await db.query.supplements.findMany({
    where: eq(supplements.pizzeriaId, session.user.pizzeriaId),
  });

  return NextResponse.json({ supplements: data });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, price } = await req.json();

  const result = await db.insert(supplements).values({
    pizzeriaId: session.user.pizzeriaId,
    name,
    price: parseFloat(price),
  }).returning();

  return NextResponse.json({ supplement: result[0] });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, price } = await req.json();

  await db.update(supplements)
    .set({ name, price: parseFloat(price) })
    .where(eq(supplements.id, id));

  return NextResponse.json({ message: 'Supplément mis à jour' });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(supplements).where(eq(supplements.id, params.id));

  return NextResponse.json({ message: 'Supplément supprimé' });
}
