// src/app/api/products/[productId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

// GET -> Para OBTENER UN producto por su ID
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params; // <-- CAMBIO CLAVE AQUÍ
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true, // Asegurémonos de incluir la categoría
        modifierGroups: {
          orderBy: { createdAt: 'asc' },
          include: {
            options: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT -> Para ACTUALIZAR un producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    
    const body = await request.json();
    const { name, description, price, categoryId } = body;

    const updatedProduct = await prisma.product.updateMany({
      where: { id: params.productId, ownerId: userId },
      data: { name, description, price: parseFloat(price), categoryId },
    });

    if (updatedProduct.count === 0) {
      return NextResponse.json({ message: 'Producto no encontrado o no tienes permiso' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}


// DELETE -> Para ELIMINAR un producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;
    
    const deleteResult = await prisma.product.deleteMany({
      where: {
        id: params.productId,
        ownerId: userId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ message: 'Producto no encontrado o no tienes permiso' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}