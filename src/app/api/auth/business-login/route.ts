// src/app/api/auth/business-login/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { compareSync } from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const { businessUsername, businessPassword } = await request.json();

    if (!businessUsername || !businessPassword) {
      return NextResponse.json({ message: 'Usuario y contraseña son requeridos' }, { status: 400 });
    }

    // 1. Buscamos la cuenta del restaurante por su nombre de usuario
    const restaurantAccount = await prisma.user.findUnique({
      where: { businessUsername },
    });

    if (!restaurantAccount) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    // 2. Comparamos la contraseña enviada con la hasheada en la BD
    const isPasswordValid = compareSync(businessPassword, restaurantAccount.businessPassword);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    // 3. Si todo es correcto, creamos un "token de sesión de restaurante"
    // Este token temporal solo confirma que se ha identificado el restaurante.
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const restaurantToken = await new SignJWT({ restaurantId: restaurantAccount.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h') // El portal expira en 1 hora
      .sign(secret);
    
    const response = NextResponse.json({ 
      message: 'Autenticación de negocio exitosa',
      restaurantId: restaurantAccount.id 
    });

    // 4. Guardamos el token en una cookie
    response.cookies.set('restaurant_token', restaurantToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hora
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}