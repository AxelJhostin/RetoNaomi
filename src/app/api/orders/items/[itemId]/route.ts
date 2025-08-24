// src/app/api/orders/items/[itemId]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Función para ACTUALIZAR la cantidad de un item
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId;
    const { quantity } = await request.json();

    if (quantity <= 0) {
      // Si la cantidad es 0 o menos, lo eliminamos
      await prisma.orderItem.delete({ where: { id: itemId } });
    } else {
      // Si no, actualizamos la cantidad
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { quantity: quantity },
      });
    }

    // Recalculamos el total del pedido después de cualquier cambio
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    const orderItems = await prisma.orderItem.findMany({ where: { orderId: item!.orderId } });
    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    await prisma.order.update({
        where: { id: item!.orderId },
        data: { total: total }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar item:', error);
    return NextResponse.json({ message: 'Error al actualizar item' }, { status: 500 });
  }
}

// Función para ELIMINAR un item del pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId;

    // Recalculamos el total ANTES de borrar el item
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (item) {
        await prisma.orderItem.delete({ where: { id: itemId } });
        const orderItems = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
        const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await prisma.order.update({
            where: { id: item.orderId },
            data: { total: total }
        });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    return NextResponse.json({ message: 'Error al eliminar item' }, { status: 500 });
  }
}