// src/app/api/orders/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

// La función GET se queda como la tenías, está perfecta.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: true,
        items: {
          include: {
            product: true,
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
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ message: 'El estado es requerido' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status },
      include: {
        table: true, // Incluimos la mesa para saber cuál notificar
      }
    });

    // Si la orden va a cocina, notificamos a la cocina
    if (status === 'COOKING') {
      const detailedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      await pusherServer.trigger('kitchen-channel', 'new-order', detailedOrder);
    }

    // --- LÓGICA AÑADIDA ---
    // Si la orden está lista, notificamos a los meseros
    if (status === 'READY') {
      await pusherServer.trigger('waiter-channel', 'order-ready', {
        tableId: updatedOrder.tableId,
        tableName: updatedOrder.table.name
      });
    }
    // ----------------------

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    return NextResponse.json({ message: 'Error al actualizar el pedido' }, { status: 500 });
  }
}