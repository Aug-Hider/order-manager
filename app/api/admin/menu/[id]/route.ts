import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzas } from '@/db/schema';
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
    
    console.log('Suppression pizza:', id);

    const result = await db.delete(pizzas)
      .where(eq(pizzas.id, id))
      .returning();

    console.log('Résultat suppression:', result);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Pizza non trouvée' }, { status: 404 });
    }

    revalidatePath('/admin/menu');

    return NextResponse.json({ message: 'Pizza supprimée', success: true });
  } catch (error) {
    console.error('Erreur suppression:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}