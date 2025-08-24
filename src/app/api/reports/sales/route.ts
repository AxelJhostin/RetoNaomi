// src/app/api/reports/sales/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    // Verificación del token del dueño (sin cambios)
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // --- ¡NUEVA LÓGICA PARA LEER FECHAS! ---
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Creamos el filtro de fecha para la consulta
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDateParam) {
      dateFilter.gte = new Date(startDateParam); // gte = mayor o igual que
    }
    if (endDateParam) {
      // Añadimos un día y restamos un segundo para incluir todo el día final
      const endDate = new Date(endDateParam);

      endDate.setHours(23, 59, 59, 999);
      dateFilter.lte = endDate; // lte = menor o igual que
    }
    // --- FIN DE LA LÓGICA DE FECHAS ---

    const closedOrders = await prisma.order.findMany({
      where: {
        status: 'CLOSED',
        staff: {
          ownerId: userId,
        },
        // --- ¡APLICAMOS EL FILTRO DE FECHA! ---
        createdAt: dateFilter,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // El resto de la lógica de cálculo (totalSales, topProducts) no cambia
    const totalSales = closedOrders.reduce((sum, order) => sum + order.total, 0);

    const productSalesCount = new Map<string, { count: number, name: string }>();
    closedOrders.forEach(order => {
      order.items.forEach(item => {
        const current = productSalesCount.get(item.productId) || { count: 0, name: item.product.name };
        productSalesCount.set(item.productId, { ...current, count: current.count + item.quantity });
      });
    });

    const topProducts = Array.from(productSalesCount.values()).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalSales,
      orderCount: closedOrders.length,
      topProducts,
    });

  } catch (error) {
    console.error("Error al generar el reporte de ventas:", error);
    return NextResponse.json({ message: 'Error al generar el reporte' }, { status: 500 });
  }
}