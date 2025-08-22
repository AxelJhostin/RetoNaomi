// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // 1. Leemos el token de la cookie
  const token = request.cookies.get('token')?.value;

  // 2. Si no hay token, lo redirigimos a la página de login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Verificamos que el token sea válido
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);

    // Si el token es válido, dejamos que continúe
    return NextResponse.next();
  } catch (error) {
    // Si el token es inválido, lo redirigimos al login
    console.error('Token inválido:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// El "matcher" le dice al middleware qué rutas debe proteger.
export const config = {
  matcher: '/dashboard/:path*', // Protegerá todas las rutas que empiecen con /dashboard
};