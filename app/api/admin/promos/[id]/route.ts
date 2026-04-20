import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { promotions } from '@/db/schema';
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

    const result = await db.delete(promotions).where(eq(promotions.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Promo non trouvée' }, { status: 404 });
    }

    revalidatePath('/admin/promos');
    return NextResponse.json({ message: 'Promo supprimée', success: true });
  } catch (error) {
    console.error('Erreur suppression promo:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}