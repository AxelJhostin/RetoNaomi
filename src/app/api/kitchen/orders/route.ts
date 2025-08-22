// src/app/api/kitchen/orders/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const activeOrders = await prisma.order.findMany({
      where: {
        // Buscamos pedidos que no estén cerrados o cancelados
        NOT: {
          status: { in: ['CLOSED', 'CANCELED'] }
        }
      },
      include: {
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Los más antiguos primero
      },
    });
    return NextResponse.json(activeOrders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener los pedidos de cocina' }, { status: 500 });
  }
}