// src/app/api/modifier-groups/[groupId]/options/[optionId]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, optionId: string } }
) {
  try {
    const optionId = params.optionId;

    await prisma.modifierOption.delete({
      where: {
        id: optionId,
      },
    });

    return new NextResponse(null, { status: 204 }); // Éxito, sin contenido
  } catch (error) {
    console.error('Error al eliminar la opción:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, optionId: string } }
) {
  try {
    const optionId = params.optionId;
    const body = await request.json();
    const { name, price } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ message: 'El nombre y el precio son requeridos' }, { status: 400 });
    }

    const updatedOption = await prisma.modifierOption.update({
      where: { id: optionId },
      data: { 
        name,
        price: parseFloat(price)
      },
    });

    return NextResponse.json(updatedOption, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar la opción:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}