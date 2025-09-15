// src/app/api/modifier-groups/[groupId]/options/[optionId]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { optionId: string } }
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