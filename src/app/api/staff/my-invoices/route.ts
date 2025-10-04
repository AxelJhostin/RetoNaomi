// src/app/api/staff/my-invoices/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación: Obtenemos el ID del mesero desde su token
    const staffToken = request.cookies.get('staff_token')?.value;
    if (!staffToken) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(staffToken, secret);
    const staffId = payload.id as string;

    // 2. Definimos el rango de fechas: "Hoy"
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Hoy a las 00:00:00
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); // Hoy a las 23:59:59

    // 3. La consulta a la base de datos
    const invoices = await prisma.invoice.findMany({
      where: {
        // Condición A: La factura fue creada hoy
        createdAt: {
          gte: startOfDay, // "greater than or equal to" el inicio del día
          lte: endOfDay,   // "less than or equal to" el final del día
        },
        // Condición B: El pedido asociado a la factura es del mesero logueado
        order: {
          staffId: staffId,
        },
      },
      // Incluimos datos adicionales que serán útiles en la interfaz
      include: {
        order: {
          include: {
            table: true, // Para mostrar el nombre de la mesa
          },
        },
      },
      // Ordenamos las facturas de la más reciente a la más antigua
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 4. Devolvemos las facturas encontradas
    return NextResponse.json(invoices);

  } catch (error) {
    console.error('Error al obtener las facturas del mesero:', error);
    if (error instanceof Error && error.name === 'JWTExpired') {
      return NextResponse.json({ message: 'Sesión expirada' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}