// src/app/api/staff/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// --- REUTILIZAMOS LA MISMA FUNCIÓN AUXILIAR ---
async function getOwnerIdFromRequest(request: NextRequest): Promise<string | null> {
  const ownerToken = request.cookies.get('token')?.value;
  const staffToken = request.cookies.get('staff_token')?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  if (ownerToken) {
    const { payload } = await jwtVerify(ownerToken, secret);
    return payload.id as string;
  }

  if (staffToken) {
    const { payload } = await jwtVerify(staffToken, secret);
    if (payload.role === 'Gerente') {
      return payload.ownerId as string;
    }
  }

  return null;
}

// --- DELETE (Eliminar) ACTUALIZADO ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const staffId = params.id;

    const deleteResult = await prisma.staff.deleteMany({
      where: {
        id: staffId,
        ownerId: ownerId, // Comprobación de seguridad
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ message: 'Empleado no encontrado o sin permiso' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar el empleado:', error);
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}

// --- PUT (Editar) ACTUALIZADO ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const staffId = params.id;
    const body = await request.json();
    const { name, pin, roleId } = body;

    if (!name || !pin || !roleId) {
      return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const updateResult = await prisma.staff.updateMany({
      where: {
        id: staffId,
        ownerId: ownerId,
      },
      data: { name, pin, roleId },
    });

    if (updateResult.count === 0) {
       return NextResponse.json({ message: 'Empleado no encontrado o sin permiso' }, { status: 404 });
    }

    const updatedStaff = await prisma.staff.findUnique({ 
        where: { id: staffId },
        include: { role: true }
    });

    return NextResponse.json(updatedStaff, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el empleado:', error);
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}