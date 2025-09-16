// src/app/api/categories/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// PUT - Actualizar una categoría
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name } = body;
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: { name },
    });
    return NextResponse.json(updatedCategory);
  } catch (error) {
    return NextResponse.json({ message: 'Error al actualizar la categoría' }, { status: 500 });
  }
}

// DELETE - Eliminar una categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Medida de seguridad: Verificamos si algún producto está usando esta categoría
    const productsWithCategory = await prisma.product.count({
      where: { categoryId: params.id },
    });

    if (productsWithCategory > 0) {
      return NextResponse.json(
        { message: 'No se puede eliminar la categoría porque está en uso por un producto.' },
        { status: 409 } // 409 Conflict
      );
    }
    
    await prisma.category.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ message: 'Error al eliminar la categoría' }, { status: 500 });
  }
}