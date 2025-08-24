import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

// La función GET no necesita cambios, está bien como la tienes.
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

// --- ¡ESTA ES LA FUNCIÓN CORREGIDA! ---
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
      include: { table: true, items: { include: { product: true } } }
    });

    // --- ¡CAMBIO AQUÍ! ---
    // Anunciamos la actualización con el evento unificado
    await pusherServer.trigger('kitchen-channel', 'kitchen-update', {
      type: 'update',
      data: updatedOrder
    });

    // También notificamos a los meseros sobre el cambio de la mesa
    if (status === 'READY' || status === 'DELIVERED') {
       // (Podríamos necesitar una lógica más específica aquí en el futuro)
    }


    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el pedido:', error);
    return NextResponse.json({ message: 'Error al actualizar el pedido' }, { status: 500 });
  }
}