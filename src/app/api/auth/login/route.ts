// src/app/api/auth/login/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Note that we no longer need to import 'cookies' here

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // The main try/catch block starts here to handle all errors
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: 'El correo y la contraseña son requeridos' }, { status: 400 });
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    // Compare the provided password with the hashed password from the database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      // If the password is correct, create the JWT
      const tokenPayload = {
        id: user.id,
        email: user.email,
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
        expiresIn: '1d',
      });

      // Create the success response
      const response = NextResponse.json(
        { message: 'Inicio de sesión exitoso' },
        { status: 200 }
      );

      // Set the token in an httpOnly cookie on the response
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      // Return the response with the cookie
      return response;

    } else {
      // If the password is not correct
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

  } catch (error) {
    // This will catch any other error that happens in the try block
    console.error('Error en el login:', error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}