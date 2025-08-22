// src/app/api/products/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al obtener los productos' },
      { status: 500 }
    );
  }
}