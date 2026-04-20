import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { staffAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'chef')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { email, password } = await req.json();
  const hash = await bcrypt.hash(password, 12);
  
  await db.update(staffAccounts)
    .set({ passwordHash: hash })
    .where(eq(staffAccounts.email, email));

  return NextResponse.json({ message: `✅ Mot de passe réinitialisé pour ${email}` });
}