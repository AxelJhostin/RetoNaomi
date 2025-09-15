// src/app/api/roles/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Función para ELIMINAR un rol por su ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    // Medida de seguridad: Verificamos si algún empleado está usando este rol
    const staffWithRole = await prisma.staff.count({
      where: {
        roleId: roleId,
      },
    });

    // Si el conteo es mayor a 0, no permitimos borrarlo
    if (staffWithRole > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar el rol porque está en uso por un empleado.' },
        { status: 409 } // 409 Conflict: indica un conflicto con el estado actual del recurso
      );
    }

    // Si nadie lo usa, procedemos a eliminarlo
    await prisma.role.delete({
      where: {
        id: roleId,
      },
    });

    return new NextResponse(null, { status: 204 }); // Éxito, sin contenido
  } catch (error) {
    console.error('Error al eliminar el rol:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}