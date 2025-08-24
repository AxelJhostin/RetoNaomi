// src/app/api/reports/sales/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  try {
    // Verificamos el token del dueño del restaurante
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // Buscamos todos los pedidos cerrados (pagados) que pertenecen al personal de este dueño
    const closedOrders = await prisma.order.findMany({
      where: {
        status: 'CLOSED',
        staff: {
          ownerId: userId,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 1. Calculamos el total de ventas sumando los totales de cada pedido
    const totalSales = closedOrders.reduce((sum, order) => sum + order.total, 0);

    // 2. Contamos cuántas veces se vendió cada producto
    const productSalesCount = new Map<string, { count: number, name: string }>();
    closedOrders.forEach(order => {
      order.items.forEach(item => {
        const current = productSalesCount.get(item.productId) || { count: 0, name: item.product.name };
        productSalesCount.set(item.productId, { ...current, count: current.count + item.quantity });
      });
    });

    // 3. Convertimos el mapa a un array y lo ordenamos para ver los más vendidos
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