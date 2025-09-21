// src/app/api/orders/[id]/close/route.ts
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;

    // Usamos una transacción para asegurar que ambas actualizaciones ocurran juntas
    const updatedOrderAndTable = await prisma.$transaction(async (tx) => {
      // 1. Actualizamos el pedido a 'CLOSED'
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CLOSED' },
      });

      // 2. Actualizamos la mesa a 'AVAILABLE'
      const table = await tx.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });

      return { order, table };
    });

    // Anunciamos la actualización de la mesa a todos los clientes
    await pusherServer.trigger(
      'tables-channel', 
      'table-update', 
      updatedOrderAndTable.table
    );

    return NextResponse.json(updatedOrderAndTable.order, { status: 200 });
  } catch (error) {
    console.error('Error al cerrar el pedido:', error);
    return NextResponse.json({ message: 'Error al cerrar el pedido' }, { status: 500 });
  }
}