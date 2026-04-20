import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await db.query.promotions.findMany({
      where: eq(promotions.pizzeriaId, session.user.pizzeriaId),
    });

    return NextResponse.json({ promos: data || [] });
  } catch (error) {
    console.error('Erreur GET promos:', error);
    return NextResponse.json({ promos: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, reductionType, reductionValue, applicationType, categoryId, pizzaIds, recurringDays, startDate, endDate, isActive } = await req.json();

    const result = await db.insert(promotions).values({
      pizzeriaId: session.user.pizzeriaId,
      name,
      description,
      reductionType: reductionType || 'percent',
      reductionValue: parseFloat(reductionValue) || 0,
      applicationType: applicationType || 'category',
      categoryId: categoryId || null,
      pizzaIds: pizzaIds || [],
      recurringDays: recurringDays || [],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive !== false,
    }).returning();

    revalidatePath('/admin/promos');
    return NextResponse.json({ promo: result[0] });
  } catch (error) {
    console.error('Erreur POST promo:', error);
    return NextResponse.json({ error: 'Erreur création' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, name, description, reductionType, reductionValue, applicationType, categoryId, pizzaIds, recurringDays, startDate, endDate, isActive } = await req.json();

    await db.update(promotions)
      .set({
        name,
        description,
        reductionType,
        reductionValue: parseFloat(reductionValue),
        applicationType,
        categoryId: categoryId || null,
        pizzaIds,
        recurringDays,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(promotions.id, id));

    revalidatePath('/admin/promos');
    return NextResponse.json({ message: 'Promo mise à jour' });
  } catch (error) {
    console.error('Erreur PUT promo:', error);
    return NextResponse.json({ error: 'Erreur modification' }, { status: 500 });
  }
}