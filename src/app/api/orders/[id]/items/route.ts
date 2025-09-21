// src/app/api/orders/[id]/items/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;
    // 1. Ahora también recibimos las 'options'
    const { productId, quantity, options } = await request.json();

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }

    // 2. Calculamos el precio de los modificadores seleccionados
    const optionsPrice = options?.reduce((total: number, option:{ price: number }) => total + option.price, 0) || 0;
    
    // 3. Calculamos el precio total de ESTE item (producto + modificadores)
    const newItemPrice = (product.price + optionsPrice) * quantity;

    // 4. Creamos el OrderItem guardando los modificadores
    const newOrderItem = await prisma.orderItem.create({
      data: {
        orderId: orderId,
        productId: productId,
        quantity: quantity,
        price: product.price, // Guardamos el precio BASE del producto
        selectedModifiers: options || [], // Guardamos el array de opciones
      },
    });

    // 5. Actualizamos el total del pedido de forma segura
    // Sumamos el precio del nuevo item al total que ya existía
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