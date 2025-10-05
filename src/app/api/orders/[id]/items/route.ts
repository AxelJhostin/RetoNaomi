// src/app/api/orders/[id]/items/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    const { productId, quantity, options, notes } = await request.json();

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }

    const optionsPrice = options?.reduce((total: number, option:{ price: number }) => total + option.price, 0) || 0;
    const newItemPrice = (product.price + optionsPrice) * quantity;

    const newOrderItem = await prisma.orderItem.create({
      data: {
        orderId: orderId,
        productId: productId,
        quantity: quantity,
        price: product.price,
        selectedModifiers: options || [],
        notes: notes,
      },
    });

    await prisma.order.update({
        where: { id: orderId },
        data: { 
          total: {
            increment: newItemPrice 
          }
        }
    });

    return NextResponse.json(newOrderItem, { status: 201 });

  } catch (error) {
    console.error('Error al añadir item:', error);
    return NextResponse.json({ message: 'Error al añadir item al pedido' }, { status: 500 });
  }
}