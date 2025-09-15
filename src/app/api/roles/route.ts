// src/app/api/roles/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const roles = await prisma.role.findMany();
    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los roles:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al obtener los roles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificamos que sea el dueño quien crea el rol
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        name,
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Error al crear el rol:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}