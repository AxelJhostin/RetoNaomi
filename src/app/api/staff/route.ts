// src/app/api/staff/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// --- FUNCIÓN AUXILIAR DE AUTENTICACIÓN ---
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

  return null; // No autorizado
}

// --- GET (Obtener lista) ACTUALIZADO ---
export async function GET(request: NextRequest) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const staff = await prisma.staff.findMany({
      where: { ownerId: ownerId },
      include: { role: true },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error('Error al obtener el personal:', error);
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}

// --- POST (Crear nuevo) ACTUALIZADO ---
export async function POST(request: NextRequest) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, pin, roleId } = body;

    if (!name || !pin || !roleId) {
      return NextResponse.json({ message: 'El nombre, PIN y rol son requeridos' }, { status: 400 });
    }
    
    const newStaffMember = await prisma.staff.create({
      data: {
        name,
        pin,
        ownerId: ownerId, // Usamos el ID del dueño verificado
        roleId: roleId,
      },
      include: { role: true },
    });

    return NextResponse.json(newStaffMember, { status: 201 });
  } catch (error) {
    console.error('Error al crear miembro del personal:', error);
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}