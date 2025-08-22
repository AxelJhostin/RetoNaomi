// src/app/api/orders/[id]/items/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const { productId, quantity } = await request.json();

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }

    const newOrderItem = await prisma.orderItem.create({
      data: {
        orderId: orderId,
        productId: productId,
        quantity: quantity,
        price: product.price, // Guardamos el precio al momento de la venta
      },
    });

    // Actualizar el total del pedido
    const orderItems = await prisma.orderItem.findMany({ where: { orderId } });
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await prisma.order.update({
        where: { id: orderId },
        data: { total: total }
    });

    return NextResponse.json(newOrderItem, { status: 201 });

  } catch (error) {
    console.error('Error al añadir item:', error);
    return NextResponse.json({ message: 'Error al añadir item al pedido' }, { status: 500 });
  }
}