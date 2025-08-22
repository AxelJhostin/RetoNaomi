// src/app/api/auth/register/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 1. Validamos que nos envíen todos los datos
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // 2. Verificamos si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'El correo electrónico ya está en uso' },
        { status: 409 } // Conflict
      );
    }

    // 3. Encriptamos (hasheamos) la contraseña
    const hashedPassword = await bcrypt.hash(password, 10); // El 10 es el "costo" de encriptación

    // 4. Creamos el nuevo usuario en la base de datos
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword, // Guardamos la contraseña encriptada
      },
    });

    // 5. Respondemos exitosamente (sin devolver la contraseña)
    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 } // Created
    );

  } catch (error) {
    console.error('Error en el registro:', error);
    return NextResponse.json(
      { success: false, message: 'Ocurrió un error en el servidor' },
      { status: 500 }
    );
  }
}