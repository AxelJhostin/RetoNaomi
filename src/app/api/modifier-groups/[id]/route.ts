// src/app/api/modifier-groups/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;

    // (Aquí podríamos añadir una verificación del token del dueño para más seguridad)

    await prisma.modifierGroup.delete({
      where: {
        id: groupId,
      },
    });

    return new NextResponse(null, { status: 204 }); // Éxito
  } catch (error) {
    console.error('Error al eliminar el grupo:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const updatedGroup = await prisma.modifierGroup.update({
      where: { id: groupId },
      data: { name },
    });

    return NextResponse.json(updatedGroup, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el grupo:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}