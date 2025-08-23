// src/app/api/tables/[id]/status/route.ts
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = params.id;
    const { status } = await request.json();

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: { status },
    });

    // Anunciamos el cambio de estado de la mesa en tiempo real
    await pusherServer.trigger('tables-channel', 'table-update', updatedTable);

    return NextResponse.json(updatedTable, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar la mesa' }, { status: 500 });
  }
}