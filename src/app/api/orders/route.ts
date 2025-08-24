// src/app/api/orders/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { pusherServer } from '@/lib/pusher'; // <-- Asegúrate de que este import esté

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('staff_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const staffId = payload.id as string;

    const { tableId } = await request.json();
    if (!tableId) {
      return NextResponse.json({ message: 'Se requiere el ID de la mesa' }, { status: 400 });
    }

    let newOrder;
    // Usamos una transacción para asegurar que ambas operaciones se completen con éxito
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Cambiar el estado de la mesa a 'OCCUPIED'
      const updatedTable = await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });

      // 2. Crear el nuevo pedido
      const order = await tx.order.create({
        data: {
          tableId: tableId,
          staffId: staffId,
        },
      });

      newOrder = order; // Guardamos el pedido para devolverlo después
      return updatedTable; // Devolvemos la mesa actualizada para el trigger de Pusher
    });

    // --- ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA! ---
    // Anunciamos que la mesa ha cambiado de estado
    await pusherServer.trigger('tables-channel', 'table-update', transactionResult);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear el pedido' }, { status: 500 });
  }
}