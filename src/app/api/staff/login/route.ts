import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ message: 'El PIN es requerido' }, { status: 400 });
    }

    const staffMember = await prisma.staff.findUnique({
      where: { pin },
      include: { role: true }, // Incluimos el rol para saber a dónde redirigir
    });

    if (!staffMember) {
      return NextResponse.json({ message: 'PIN inválido' }, { status: 401 });
    }

    // Creamos un token JWT para el empleado
    const tokenPayload = {
      id: staffMember.id,
      name: staffMember.name,
      role: staffMember.role.name, // Guardamos el nombre del rol
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '1d' });

    const response = NextResponse.json({ 
      message: 'Inicio de sesión exitoso',
      user: tokenPayload
    });

    // Guardamos el token en una cookie
    response.cookies.set('staff_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Ocurrió un error en el servidor' }, { status: 500 });
  }
}