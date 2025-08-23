// src/app/api/orders/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true, // Incluye info de la mesa
        items: {     // Incluye los productos del pedido
          include: {
            product: true, // Incluye info de cada producto
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener el pedido' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ message: 'El estado es requerido' }, { status: 400 });
    }

    // Usamos una transacción para actualizar el pedido y la mesa al mismo tiempo
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Actualizamos el pedido
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: status },
        include: { table: true, items: { include: { product: true } } }
      });

      // 2. Si el pedido se marca como listo, liberamos la mesa
      if (status === 'READY') {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      return order;
    });

    // Anunciamos la actualización por Pusher
    await pusherServer.trigger('kitchen-channel', 'order-update', updatedOrder);

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    return NextResponse.json({ message: 'Error al actualizar el pedido' }, { status: 500 });
  }
}