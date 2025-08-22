// src/app/api/products/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Función para manejar peticiones DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtenemos el ID del producto desde los parámetros de la URL
    const productId = params.id;

    // Verificamos el token del usuario para asegurar que es el dueño
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Eliminamos el producto usando Prisma
    // ¡Importante! Añadimos una condición `where` para asegurarnos
    // de que el usuario solo puede borrar sus propios productos.
    const deleteResult = await prisma.product.deleteMany({
      where: {
        id: productId,
        ownerId: userId, // Comprobación de seguridad
      },
    });

    // Si no se borró ningún producto, significa que no se encontró o no era del usuario
    if (deleteResult.count === 0) {
      return NextResponse.json(
        { message: 'Producto no encontrado o no tienes permiso para eliminarlo' },
        { status: 404 }
      );
    }

    // Si se borró, devolvemos una respuesta exitosa sin contenido
    return new NextResponse(null, { status: 204 }); // 204 = No Content

  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al eliminar el producto' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;

    // Verificación del usuario
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Obtenemos los nuevos datos del cuerpo de la petición
    const body = await request.json();
    const { name, description, price, category } = body;

    if (!name || !price) {
      return NextResponse.json({ message: 'El nombre y el precio son requeridos' }, { status: 400 });
    }

    // Actualizamos el producto en la base de datos
    // Usamos updateMany para poder incluir la comprobación de seguridad del ownerId
    const updateResult = await prisma.product.updateMany({
      where: {
        id: productId,
        ownerId: userId, // Solo puede actualizar si es el dueño
      },
      data: {
        name,
        description,
        price,
        category,
      },
    });

    if (updateResult.count === 0) {
       return NextResponse.json(
        { message: 'Producto no encontrado o no tienes permiso para editarlo' },
        { status: 404 }
      );
    }

    // Devolvemos el producto actualizado
    const updatedProduct = await prisma.product.findUnique({ where: { id: productId }});

    return NextResponse.json(updatedProduct, { status: 200 });

  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al actualizar el producto' },
      { status: 500 }
    );
  }
}