import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await db.query.pizzas.findMany({
      where: eq(pizzas.pizzeriaId, session.user.pizzeriaId),
    });

    return NextResponse.json({ pizzas: data });
  } catch (error) {
    console.error('Erreur GET pizzas:', error);
    return NextResponse.json({ pizzas: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, ingredients, basePrice, categoryId, aiKeywords } = await req.json();

    const result = await db.insert(pizzas).values({
      pizzeriaId: session.user.pizzeriaId,
      categoryId: categoryId || null,
      name,
      description,
      ingredients,
      basePrice: parseFloat(basePrice),
      aiKeywords: aiKeywords || [],
    }).returning();

    revalidatePath('/admin/menu');
    return NextResponse.json({ pizza: result[0] });
  } catch (error) {
    console.error('Erreur POST pizza:', error);
    return NextResponse.json({ error: 'Erreur création pizza' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, name, description, ingredients, basePrice, categoryId, aiKeywords } = await req.json();

    await db.update(pizzas)
      .set({
        name,
        description,
        ingredients,
        basePrice: parseFloat(basePrice),
        categoryId: categoryId || null,
        aiKeywords: aiKeywords || [],
        updatedAt: new Date(),
      })
      .where(eq(pizzas.id, id));

    revalidatePath('/admin/menu');
    return NextResponse.json({ message: 'Pizza mise à jour' });
  } catch (error) {
    console.error('Erreur PUT pizza:', error);
    return NextResponse.json({ error: 'Erreur modification pizza' }, { status: 500 });
  }
}