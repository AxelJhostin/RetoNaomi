// src/app/api/staff/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Función para OBTENER la lista del personal
export async function GET(request: NextRequest) {
  try {
    // Verificamos el token para saber de qué dueño es el personal
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Buscamos en la base de datos todo el personal que pertenezca al usuario logueado
    const staff = await prisma.staff.findMany({
      where: {
        ownerId: userId,
      },
      // Incluimos la información del rol para mostrar su nombre en la UI
      include: {
        role: true,
      },
    });

    return NextResponse.json(staff, { status: 200 });
  } catch (error) {
    console.error('Error al obtener el personal:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

// Función para CREAR un nuevo miembro del personal
export async function POST(request: NextRequest) {
  try {
    // Verificamos el token del dueño
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Obtenemos los datos del nuevo miembro del cuerpo de la petición
    const body = await request.json();
    const { name, pin, roleId } = body;

    if (!name || !pin || !roleId) {
      return NextResponse.json({ message: 'El nombre, PIN y rol son requeridos' }, { status: 400 });
    }
    
    // Por ahora, no encriptaremos el PIN, pero se podría hacer con bcrypt igual que la contraseña

    const newStaffMember = await prisma.staff.create({
      data: {
        name,
        pin,
        ownerId: userId, // Lo asociamos con el dueño
        roleId: roleId,   // Lo asociamos con el rol
      },
    });

    return NextResponse.json(newStaffMember, { status: 201 });
  } catch (error) {
    console.error('Error al crear miembro del personal:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}