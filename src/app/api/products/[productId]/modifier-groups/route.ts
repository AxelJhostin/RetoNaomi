// src/app/api/products/[productId]/modifier-groups/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'El nombre del grupo es requerido' }, { status: 400 });
    }

    const modifierGroup = await prisma.modifierGroup.create({
      data: {
        name,
        productId: productId,
      },
    });

    return NextResponse.json(modifierGroup, { status: 201 });
  } catch (error) {
    console.error('Error al crear el grupo de modificadores:', error);
    return NextResponse.json({ message: 'Error al crear el grupo de modificadores' }, { status: 500 });
  }
}