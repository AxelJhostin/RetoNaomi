// src/app/api/tables/[id]/active-order/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Está función maneja la solicitud GET para obtener el pedido activo de una mesa específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Extraer el ID de la mesa de los parámetros de la ruta
  try {
    const tableId = params.id;
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId: tableId,
        status: {
          in: ['OPEN', 'COOKING', 'READY', 'DELIVERED']
        }
      },
    });

    if (!activeOrder) {
      return NextResponse.json({ message: 'No hay pedido activo para esta mesa' }, { status: 404 });
    }

    return NextResponse.json(activeOrder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al buscar pedido activo' }, { status: 500 });
  }
}