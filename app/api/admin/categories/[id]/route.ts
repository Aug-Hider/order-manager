import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzaCategories, pizzas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const pizzasInCategory = await db.query.pizzas.findMany({
      where: eq(pizzas.categoryId, id),
    });

    if (pizzasInCategory.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une catégorie non vide' },
        { status: 400 }
      );
    }

    await db.delete(pizzaCategories).where(eq(pizzaCategories.id, id));
    revalidatePath('/admin/categories');
    return NextResponse.json({ message: 'Catégorie supprimée', success: true });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}