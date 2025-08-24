// src/app/api/staff/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    // Buscamos la cookie del empleado
    const token = request.cookies.get('staff_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    // Verificamos el token y devolvemos los datos que contiene (el "payload")
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({ user: payload });

  } catch (error) {
    return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 401 });
  }
}