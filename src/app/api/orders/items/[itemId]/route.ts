// src/app/api/orders/items/[itemId]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { type OrderItem } from '@prisma/client';

// Definimos el tipo para los modificadores para hacer el código más seguro
type SelectedModifier = { name: string; price: number; };

// Reutilizamos esta función de cálculo en PUT y DELETE
const calculateOrderTotal = (orderItems: OrderItem[]): number => {
  return orderItems.reduce((totalSum, item) => {
    // Sumamos el precio de los modificadores para este item
    const modifiersPrice = ((item.selectedModifiers as SelectedModifier[]) || []).reduce(
      (modifierSum, modifier) => modifierSum + modifier.price,
      0
    );
    // Calculamos el precio total del item (base + modificadores) * cantidad
    const itemTotal = (item.price + modifiersPrice) * item.quantity;
    return totalSum + itemTotal;
  }, 0);
};

// Función para ACTUALIZAR la cantidad de un item
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const itemId = params.itemId;
    const { quantity } = await request.json();

    const itemToUpdate = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!itemToUpdate) throw new Error('Item no encontrado');

    if (quantity <= 0) {
      await prisma.orderItem.delete({ where: { id: itemId } });
    } else {
      await prisma.orderItem.update({
        where: { id: itemId },
        data: { quantity: quantity },
      });
    }

    // Recalculamos el total del pedido después de cualquier cambio
    const orderItems = await prisma.orderItem.findMany({ 
      where: { orderId: itemToUpdate.orderId } 
    });

    // --- LÓGICA DE CÁLCULO CORREGIDA ---
    const total = calculateOrderTotal(orderItems);
    
    await prisma.order.update({
      where: { id: itemToUpdate.orderId },
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

    const itemToDelete = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!itemToDelete) {
      // Si el item ya no existe, no hacemos nada
      return new NextResponse(null, { status: 204 });
    }
    
    const orderId = itemToDelete.orderId;
    await prisma.orderItem.delete({ where: { id: itemId } });
    
    const remainingOrderItems = await prisma.orderItem.findMany({ 
      where: { orderId: orderId } 
    });

    // --- LÓGICA DE CÁLCULO CORREGIDA ---
    const total = calculateOrderTotal(remainingOrderItems);

    await prisma.order.update({
      where: { id: orderId },
      data: { total: total }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    return NextResponse.json({ message: 'Error al eliminar item' }, { status: 500 });
  }
}