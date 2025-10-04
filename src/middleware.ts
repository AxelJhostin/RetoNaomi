// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// Interfaz para el contenido de nuestro token del personal
interface StaffTokenPayload extends JWTPayload {
  id: string;
  role: string;
}

// Función auxiliar para verificar el token del personal
async function verifyStaffToken(token: string): Promise<StaffTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as StaffTokenPayload;
  } catch (error) {
    console.error('Error de verificación de token en Middleware:', error);
    return null;
  }
}


// --- El Middleware Principal y Unificado ---
export async function middleware(request: NextRequest) {
  const ownerToken = request.cookies.get('token')?.value;
  const staffToken = request.cookies.get('staff_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Lógica de protección para /dashboard
  if (pathname.startsWith('/dashboard')) {
    // Las rutas de reportes son especiales
    if (pathname.startsWith('/dashboard/sales-report')) {
      // Si es una ruta de reporte, permitimos al dueño O al gerente
      if (ownerToken) return NextResponse.next(); // Pasa si es dueño

      if (staffToken) {
        const userData = await verifyStaffToken(staffToken);
        // Pasa si es un gerente verificado
        if (userData?.role === 'Gerente') {
          return NextResponse.next();
        }
      }
      // Si no es ninguno, redirigimos al login correspondiente
      const url = request.nextUrl.clone();
      url.pathname = staffToken ? '/manager' : '/login'; // Si tiene token de staff pero no es gerente, a su home
      return NextResponse.redirect(url);

    } else {
      // Para el resto del dashboard, solo el dueño puede pasar
      if (!ownerToken) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  // 2. Proteger las rutas del Personal (Gerente, Mesero, Cocinero)
  const staffRoutes = ['/manager', '/waiter', '/kitchen'];
  if (staffRoutes.some(route => pathname.startsWith(route))) {
    
    if (!staffToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/staff-login';
      return NextResponse.redirect(url);
    }

    const userData = await verifyStaffToken(staffToken);

    if (!userData) {
      const url = request.nextUrl.clone();
      url.pathname = '/staff-login';
      return NextResponse.redirect(url);
    }

    // Lógica de redirección basada en el rol
    const { role } = userData;
    let homePath = '';

    switch (role) {
      case 'Gerente':
        homePath = '/manager';
        break;
      case 'Mesero':
        homePath = '/waiter';
        break;
      case 'Cocinero':
        homePath = '/kitchen';
        break;
      default:
        const url = request.nextUrl.clone();
        url.pathname = '/staff-login';
        return NextResponse.redirect(url);
    }

    // Si el usuario intenta acceder a una ruta que no es la suya, lo redirigimos
    if (!pathname.startsWith(homePath)) {
      const url = request.nextUrl.clone();
      url.pathname = homePath;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}


// --- Configuración del Middleware Actualizada ---
// Ahora el "guardia" vigila todas las puertas importantes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/manager/:path*',
    '/waiter/:path*',
    '/kitchen/:path*',
  ],
};