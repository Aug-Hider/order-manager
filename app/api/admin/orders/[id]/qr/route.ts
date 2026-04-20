import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, qrCodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Générer l'URL du QR code
    const qrUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/scan-qr?order=${id}`;

    // Créer une entrée QR code
    const result = await db.insert(qrCodes).values({
      orderId: id,
      pizzeriaId: session.user.pizzeriaId,
      qrContent: qrUrl,
    }).returning();

    return NextResponse.json({ qr: result[0], qrUrl });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur génération QR' }, { status: 500 });
  }
}