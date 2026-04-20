import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplements } from '@/db/schema';
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
    await db.delete(supplements).where(eq(supplements.id, id));
    revalidatePath('/admin/supplements');
    return NextResponse.json({ message: 'Supplément supprimé', success: true });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
}