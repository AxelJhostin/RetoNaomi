// src/app/api/modifier-groups/[groupId]/options/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const groupId = params.groupId;
    const body = await request.json();
    const { name, price } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ message: 'El nombre y el precio de la opción son requeridos' }, { status: 400 });
    }

    const modifierOption = await prisma.modifierOption.create({
      data: {
        name,
        price,
        groupId: groupId,
      },
    });

    return NextResponse.json(modifierOption, { status: 201 });
  } catch (error) {
    console.error('Error al crear la opción de modificador:', error);
    return NextResponse.json({ message: 'Error al crear la opción de modificador' }, { status: 500 });
  }
}