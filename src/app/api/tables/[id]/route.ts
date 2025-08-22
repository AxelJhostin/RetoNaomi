// src/app/api/tables/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = params.id;

    // Verificamos el token del dueño para asegurar que tiene permiso
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Eliminamos la mesa, asegurándonos que pertenezca al dueño
    const deleteResult = await prisma.table.deleteMany({
      where: {
        id: tableId,
        ownerId: userId, // Comprobación de seguridad
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: 'Mesa no encontrada o no tienes permiso para eliminarla' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 }); // Éxito sin contenido

  } catch (error) {
    console.error('Error al eliminar la mesa:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al eliminar la mesa' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tableId = params.id;

    // Verificación del token del dueño
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Obtenemos los nuevos datos del cuerpo de la petición
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    // Actualizamos la mesa, asegurándonos que pertenezca al dueño
    const updateResult = await prisma.table.updateMany({
      where: {
        id: tableId,
        ownerId: userId,
      },
      data: { name },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { message: 'Mesa no encontrada o no tienes permiso para editarla' },
        { status: 404 }
      );
    }

    const updatedTable = await prisma.table.findUnique({ where: { id: tableId } });
    return NextResponse.json(updatedTable, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar la mesa:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al actualizar la mesa' },
      { status: 500 }
    );
  }
}