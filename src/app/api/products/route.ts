// src/app/api/products/route.ts

export const dynamic = 'force-dynamic';

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

// GET -> Para obtener TODOS los productos del usuario
export async function GET(request: NextRequest) {
  try {
    const staffToken = request.cookies.get('staff_token')?.value;
    const ownerToken = request.cookies.get('token')?.value;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    
    let ownerId: string | null = null;

    // Priorizamos verificar si es un miembro del personal
    if (staffToken) {
      try {
        const { payload } = await jwtVerify(staffToken, secret);
        ownerId = payload.ownerId as string;
      } catch (error) {
        // El token del personal es inválido, no hacemos nada y dejamos que falle después
      }
    } 
    // Si no es personal, verificamos si es el dueño
    else if (ownerToken) {
      try {
        const { payload } = await jwtVerify(ownerToken, secret);
        ownerId = payload.id as string;
      } catch (error) {
        // El token del dueño es inválido
      }
    }

    // Si después de verificar ambos no tenemos un ownerId, denegamos el acceso
    if (!ownerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('[API /products] Buscando productos para ownerId:', ownerId);
    // Si llegamos aquí, tenemos permiso. Buscamos los productos del restaurante.
    const products = await prisma.product.findMany({
      where: {
        ownerId: ownerId,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        category: true,
        modifierGroups: {
          include: {
            options: {
              orderBy: {
                price: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: 'Something went wrong fetching products.' },
      { status: 500 }
    );
  }
}

// POST -> Para CREAR un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, category, description } = body;

    if (!name || price === undefined) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        category,
        description,
        ownerId: userId,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}