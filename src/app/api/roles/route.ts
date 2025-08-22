// src/app/api/roles/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

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