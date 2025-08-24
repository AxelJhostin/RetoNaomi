import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('staff_token')?.value;
    if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const staffId = payload.id as string;

    const { tableId } = await request.json();
    if (!tableId) return NextResponse.json({ message: 'Se requiere el ID de la mesa' }, { status: 400 });

    let createdOrder;
    const updatedTable = await prisma.$transaction(async (tx) => {
      const table = await tx.table.update({
        where: { id: tableId, status: 'AVAILABLE' },
        data: { status: 'OCCUPIED' },
      });

      const order = await tx.order.create({
        data: { tableId, staffId, status: 'OPEN' },
        include: { table: true, items: { include: { product: true } } }
      });
      createdOrder = order;
      return table;
    });

    await pusherServer.trigger('tables-channel', 'table-update', updatedTable);

    // --- ¡CAMBIO AQUÍ! ---
    // Enviamos el evento unificado con su tipo
    await pusherServer.trigger('kitchen-channel', 'kitchen-update', { 
      type: 'new', 
      data: createdOrder 
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear el pedido' }, { status: 500 });
  }
}