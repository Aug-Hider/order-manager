import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzaCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await db.query.pizzaCategories.findMany({
    where: eq(pizzaCategories.pizzeriaId, session.user.pizzeriaId),
    orderBy: (cat) => cat.sortOrder,
  });

  return NextResponse.json({ categories: data });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, sortOrder } = await req.json();

  const result = await db.insert(pizzaCategories).values({
    pizzeriaId: session.user.pizzeriaId,
    name,
    description,
    sortOrder: sortOrder || 0,
  }).returning();

  revalidatePath('/admin/categories');
  revalidatePath('/admin/menu');

  return NextResponse.json({ category: result[0] });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, name, description, sortOrder } = await req.json();

  await db.update(pizzaCategories)
    .set({ name, description, sortOrder })
    .where(eq(pizzaCategories.id, id));

  revalidatePath('/admin/categories');
  revalidatePath('/admin/menu');

  return NextResponse.json({ message: 'Catégorie mise à jour' });
}