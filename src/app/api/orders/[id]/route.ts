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
    const { id: orderId } = params;
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
    const { id: orderId } = params;
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Buscamos la orden para saber qué mesa está asociada a ella
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { tableId: true }, // Solo necesitamos el ID de la mesa
    });

    if (!order) {
      // Si la orden no existe, no hay nada que hacer
      return new NextResponse(null, { status: 204 });
    }

    // Usamos una transacción para asegurar que ambas operaciones se completen
    await prisma.$transaction([
      // 1. Borramos el pedido
      prisma.order.delete({
        where: { id: orderId },
      }),
      // 2. Actualizamos el estado de la mesa a 'AVAILABLE'
      prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      }),
    ]);
    
    // Aquí podríamos notificar a los meseros por Pusher que la mesa se liberó

    return new NextResponse(null, { status: 204 }); // Éxito
  } catch (error) {
    console.error("Error al eliminar la orden:", error);
    return NextResponse.json({ error: 'Error al eliminar la orden' }, { status: 500 });
  }
}