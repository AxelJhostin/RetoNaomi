// src/app/api/products/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

// --- NUESTRA FUNCIÓN DE AUTENTICACIÓN UNIFICADA ---
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

  return null; // No autorizado
}

// --- GET (Obtener lista) ACTUALIZADO ---
export async function GET(request: NextRequest) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ error: 'No autenticado o sin permisos' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { ownerId: ownerId },
      orderBy: { name: 'asc' },
      include: {
        category: true,
        modifierGroups: {
          include: { options: { orderBy: { price: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json({ error: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}

// --- POST (Crear nuevo) ACTUALIZADO ---
export async function POST(request: NextRequest) {
  try {
    const ownerId = await getOwnerIdFromRequest(request);
    if (!ownerId) {
      return NextResponse.json({ error: 'No autenticado o sin permisos' }, { status: 401 });
    }

    const body = await request.json();
    // NOTA: Tu código original usaba 'category', pero tu schema usa 'categoryId'. Lo ajustamos.
    const { name, price, description, categoryId } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Nombre y precio son requeridos' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        categoryId, // Usamos categoryId
        ownerId: ownerId, // Usamos el ID del dueño verificado
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json({ error: 'Ocurrió un error' }, { status: 500 });
  }
}