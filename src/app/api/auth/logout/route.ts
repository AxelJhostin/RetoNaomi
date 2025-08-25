// src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Sesión cerrada exitosamente' });

    // Le decimos al navegador que borre la cookie 'token'
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Fija la fecha de expiración en el pasado
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error al cerrar sesión' }, { status: 500 });
  }
}