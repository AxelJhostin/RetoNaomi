// src/app/api/products/route.ts
import prisma from '@/lib/prisma'; // <-- ¡El gran cambio!
import { NextResponse } from 'next/server';

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