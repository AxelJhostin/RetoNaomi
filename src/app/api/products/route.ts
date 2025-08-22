// src/app/api/products/route.ts
import prisma from '@/lib/prisma'; // <-- ¡El gran cambio!
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

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

export async function POST(request: NextRequest) {
  try {
    // Obtenemos el token del usuario desde las cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    // Verificamos el token y extraemos los datos del usuario (el payload)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string; // Obtenemos el ID del usuario logueado

    // Obtenemos los datos del nuevo producto del cuerpo de la petición
    const body = await request.json();
    const { name, description, price, category } = body;

    if (!name || !price) {
      return NextResponse.json({ message: 'El nombre y el precio son requeridos' }, { status: 400 });
    }

    // Creamos el nuevo producto en la base de datos, conectándolo con el usuario dueño
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price,
        category,
        ownerId: userId, // ¡Aquí conectamos el producto al dueño!
      },
    });

    return NextResponse.json(newProduct, { status: 201 }); // 201 = Created
  } catch (error) {
    console.error('Error al crear el producto:', error);
    return NextResponse.json(
      { message: 'Ocurrió un error al crear el producto' },
      { status: 500 }
    );
  }
}