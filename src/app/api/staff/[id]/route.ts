// src/app/api/staff/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Función para manejar peticiones DELETE para el personal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = params.id;

    // Verificamos el token del dueño para asegurar que tiene permiso
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Eliminamos al miembro del personal, asegurándonos que pertenezca al dueño
    const deleteResult = await prisma.staff.deleteMany({
      where: {
        id: staffId,
        ownerId: userId, // Comprobación de seguridad
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: 'Empleado no encontrado o no tienes permiso para eliminarlo' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 }); // 204 = No Content (éxito)

  } catch (error) {
    console.error('Error al eliminar el empleado:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al eliminar el empleado' },
      { status: 500 }
    );
  }
}