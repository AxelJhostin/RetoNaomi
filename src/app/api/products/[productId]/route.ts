// src/app/api/products/[productId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

// --- REUTILIZAMOS LA MISMA FUNCIÓN DE AUTENTICACIÓN ---
async function getOwnerIdFromRequest(request: NextRequest): Promise<string | null> {
  const ownerToken = request.cookies.get('token')?.value;
  const staffToken = request.cookies.get('staff_token')?.value;
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  if (ownerToken) {
    const { payload } = await jwtVerify(ownerToken, secret);
    return payload.id as string;
  }

  if (staffToken) {
    const { payload } = await jwtVerify(staffToken, secret);
    if (payload.role === 'Gerente') {
      return payload.ownerId as string;
    }
  }

  return null;
}

// --- GET (Obtener uno) AHORA SEGURO ---
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // AÑADIMOS LA VERIFICACIÓN DE PERMISOS
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { productId } = params;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      // ... el 'include' se mantiene igual
      include: {
        category: true,
        modifierGroups: {
          orderBy: { createdAt: 'asc' },
          include: { options: { orderBy: { createdAt: 'asc' } } },
        },
      },
    });

    if (!product || product.ownerId !== ownerId) {
      return NextResponse.json({ message: 'Producto no encontrado o sin permiso' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// --- PUT (Actualizar) ACTUALIZADO ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description, price, categoryId } = body;
    const { productId } = params;
    
    const updatedProduct = await prisma.product.updateMany({
      where: { id: productId, ownerId: ownerId }, // Verificación de propiedad
      data: { name, description, price: parseFloat(price), categoryId },
    });

    if (updatedProduct.count === 0) {
      return NextResponse.json({ message: 'Producto no encontrado o sin permiso' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}

// --- DELETE (Eliminar) ACTUALIZADO ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { productId } = params;
    const deleteResult = await prisma.product.deleteMany({
      where: { id: productId, ownerId: ownerId }, // Verificación de propiedad
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ message: 'Producto no encontrado o sin permiso' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}