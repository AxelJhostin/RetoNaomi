// src/app/api/auth/register/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs'; // Usamos hash de bcryptjs que es async

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 1. Obtenemos los nuevos campos del body
    const { email, password, name, businessUsername, businessPassword } = body;

    // 2. Validamos que todos los campos requeridos estén presentes
    if (!email || !password || !name || !businessUsername || !businessPassword) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // 3. Verificamos si el email o el usuario de negocio ya existen
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { businessUsername: businessUsername }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'El correo o el usuario de negocio ya están en uso' },
        { status: 409 } // Conflict
      );
    }

    // 4. Encriptamos AMBAS contraseñas
    const hashedOwnerPassword = await hash(password, 10);
    const hashedBusinessPassword = await hash(businessPassword, 10);

    // 5. Creamos el nuevo usuario con todos los datos
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedOwnerPassword,
        businessUsername,
        businessPassword: hashedBusinessPassword,
      },
    });

    // 6. Respondemos exitosamente (sin devolver las contraseñas)
    return NextResponse.json({
        message: 'Usuario creado exitosamente',
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
    }, { status: 201 });

  } catch (error) {
    console.error('Error en el registro:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}