// src/app/api/invoices/by-date/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación: Verificamos que sea el dueño del restaurante
    const ownerToken = request.cookies.get('token')?.value;
    if (!ownerToken) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(ownerToken, secret);
    const ownerId = payload.id as string;

    // 2. Obtenemos la fecha de los parámetros de la URL (ej: ?date=2025-10-03)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // Formato YYYY-MM-DD
    
    if (!dateParam) {
      return NextResponse.json({ message: 'El parámetro de fecha es requerido' }, { status: 400 });
    }

    // 3. Definimos el rango de fechas para el día solicitado
    const targetDate = new Date(dateParam + 'T00:00:00'); // Aseguramos que sea la zona horaria local
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
    
    // 4. La consulta a la base de datos
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        // Buscamos facturas cuyo pedido, a través del mesero, pertenezca al dueño
        order: {
          staff: {
            ownerId: ownerId,
          },
        },
      },
      include: {
        order: {
          include: {
            table: true,  // Para el nombre de la mesa
            staff: true,  // Para el nombre del mesero
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 5. Devolvemos las facturas encontradas
    return NextResponse.json(invoices);

  } catch (error) {
    console.error('Error al obtener las facturas por fecha:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}