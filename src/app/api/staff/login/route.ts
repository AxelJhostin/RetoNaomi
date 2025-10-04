// src/app/api/staff/login/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose'; // <-- 1. Importamos jwtVerify

export async function POST(request: NextRequest) {
  try {
    // 2. Leemos la cookie que identifica al restaurante
    const restaurantToken = request.cookies.get('restaurant_token')?.value;
    if (!restaurantToken) {
      throw new Error('Sesión de restaurante no encontrada. Vuelva a la página de login principal.');
    }

    // Verificamos el token del restaurante para obtener su ID
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(restaurantToken, secret);
    const restaurantId = payload.restaurantId as string;

    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ message: 'El PIN es requerido' }, { status: 400 });
    }

    // 3. Hacemos la consulta CORRECTA usando el identificador compuesto
    const staffMember = await prisma.staff.findUnique({
      where: {
        ownerId_pin: {
          ownerId: restaurantId,
          pin: pin,
        },
      },
      include: { role: true },
    });

    if (!staffMember) {
      return NextResponse.json({ message: 'PIN inválido para este restaurante' }, { status: 401 });
    }

    // El resto de la lógica para crear el token del empleado se mantiene igual
    const tokenPayload = {
      id: staffMember.id,
      name: staffMember.name,
      role: staffMember.role.name,
      ownerId: staffMember.ownerId,
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1d' });

    const response = NextResponse.json({ 
      message: 'Inicio de sesión exitoso',
      user: tokenPayload
    });

    response.cookies.set('staff_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Error en el login de personal:", error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error en el servidor';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}