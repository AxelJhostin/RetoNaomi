// src/app/api/modifier-groups/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

// Helper para verificar el token y obtener el ID del usuario
async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload.id as string;
  } catch (error) {
    return null;
  }
}

// POST -> Para CREAR un nuevo Grupo de Modificadores
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación: Verificamos que sea el dueño del restaurante
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Extraer Datos: Leemos la información enviada desde el formulario
    const body = await request.json();
    const { name, productId } = body;

    if (!name || !productId) {
      return NextResponse.json({ error: 'El nombre y el ID del producto son requeridos' }, { status: 400 });
    }

    // 3. Verificación de Permiso: Nos aseguramos que el producto pertenezca al usuario
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        ownerId: userId,
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado o no tienes permiso sobre él' }, { status: 404 });
    }

    // 4. Crear en la Base de Datos: Usamos Prisma para crear el nuevo grupo
    const newModifierGroup = await prisma.modifierGroup.create({
      data: {
        name,
        productId,
      },
    });

    // 5. Responder: Enviamos el nuevo grupo creado de vuelta al frontend
    return NextResponse.json(newModifierGroup, { status: 201 });

  } catch (error) {
    console.error("Error al crear el grupo de modificadores:", error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}