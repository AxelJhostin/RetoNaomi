// src/app/api/auth/login/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

// Creamos una instancia del cliente de Prisma
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'El correo y la contraseña son requeridos' },
        { status: 400 }
      );
    }

    // --- ¡AQUÍ EMPIEZA LA NUEVA LÓGICA! ---

    // 1. Buscamos al usuario en la base de datos por su email
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    // 2. Si no encontramos al usuario, las credenciales son inválidas
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // 3. Comparamos la contraseña (¡Por ahora, sin encriptar!)
    const isPasswordCorrect = user.password === password;

    if (isPasswordCorrect) {
      return NextResponse.json(
        { success: true, message: 'Inicio de sesión exitoso' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    // --- FIN DE LA NUEVA LÓGICA ---

  } catch (error) {
    console.error('Error inesperado en el login:', error);
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error en el servidor' },
      { status: 500 }
    );
  }
}