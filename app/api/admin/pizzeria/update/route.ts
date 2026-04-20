import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzerias } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'chef')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name } = await req.json();

  await db.update(pizzerias)
    .set({ name, updatedAt: new Date() })
    .where(eq(pizzerias.id, session.user.pizzeriaId));

  return NextResponse.json({ message: `✅ Nom mis à jour en "${name}"` });
}