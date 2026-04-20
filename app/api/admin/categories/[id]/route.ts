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

    // Vérifier si la catégorie contient des pizzas
    const pizzasInCategory = await db.query.pizzas.findMany({
      where: eq(pizzas.categoryId, id),
    });

    if (pizzasInCategory.length > 0) {
      return NextResponse.json(
        { error: `Cette catégorie contient ${pizzasInCategory.length} pizza(s). Veuillez les déplacer ou les supprimer avant de supprimer la catégorie.` },
        { status: 400 }
      );
    }

    const result = await db.delete(pizzaCategories).where(eq(pizzaCategories.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    revalidatePath('/admin/categories');
    revalidatePath('/admin/menu');
    return NextResponse.json({ message: 'Catégorie supprimée', success: true });
  } catch (error) {
    console.error('Erreur suppression:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}