import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pizzeriaConfigs, orders } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.pizzeriaId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { totalPizzas } = await req.json();

  try {
    const config = await db.query.pizzeriaConfigs.findFirst({
      where: eq(pizzeriaConfigs.pizzeriaId, session.user.pizzeriaId),
    });

    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // Récupérer les commandes en cours
    const activeOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.pizzeriaId, session.user.pizzeriaId),
        inArray(orders.status, ['paid', 'preparing'])
      ),
    });

    const totalPizzasInProgress = activeOrders.reduce((sum, o) => sum + (o.totalPizzas || 0), 0);

    // Calculer le temps nécessaire
    const batchesNeeded = Math.ceil(totalPizzas / config.maxConcurrentPizzas);
    const prepTimeMinutes = batchesNeeded * config.averagePizzaTime;

    // Calculer l'heure prête
    const now = new Date();
    const readyTime = new Date(now.getTime() + prepTimeMinutes * 60000);

    // Chercher si y'a un créneau avant (optimisation)
    let optimizedTime = readyTime;
    const slotMinutes = config.averagePizzaTime;
    
    // Vérifier les créneaux libres dans les 2h
    for (let i = 0; i < 120 / slotMinutes; i++) {
      const potentialTime = new Date(now.getTime() + (i * slotMinutes * 60000));
      const pizzasAtTime = activeOrders.filter(o => {
        const ready = new Date(o.estimatedReadyTime || now);
        return ready <= potentialTime;
      }).reduce((sum, o) => sum + (o.totalPizzas || 0), 0);

      if (pizzasAtTime + totalPizzas <= config.maxConcurrentPizzas) {
        optimizedTime = new Date(potentialTime.getTime() + (prepTimeMinutes * 60000));
        break;
      }
    }

    return NextResponse.json({
      estimatedReadyTime: readyTime,
      optimizedReadyTime: optimizedTime,
      prepTimeMinutes,
      pizzasInProgress: totalPizzasInProgress,
      maxConcurrent: config.maxConcurrentPizzas,
      averagePizzaTime: config.averagePizzaTime,
    });
  } catch (error) {
    console.error('Erreur calcul:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}