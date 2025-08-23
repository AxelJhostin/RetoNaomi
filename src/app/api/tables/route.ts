// src/app/api/tables/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Función para OBTENER las mesas
export async function GET(request: NextRequest) {
  try {
    const ownerToken = request.cookies.get('token')?.value;
    const staffToken = request.cookies.get('staff_token')?.value;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    let ownerId: string | null = null;

    if (ownerToken) {
      // Si es el dueño, obtenemos su ID del token de dueño
      const { payload } = await jwtVerify(ownerToken, secret);
      ownerId = payload.id as string;
    } else if (staffToken) {
      // Si es un empleado, obtenemos el ID del dueño desde el token de empleado
      const { payload } = await jwtVerify(staffToken, secret);
      ownerId = payload.ownerId as string;
    }

    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const tables = await prisma.table.findMany({
      where: { ownerId: ownerId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tables, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}

// Función para CREAR una nueva mesa
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const newTable = await prisma.table.create({
      data: {
        name,
        ownerId: userId,
      },
    });

    return NextResponse.json(newTable, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}