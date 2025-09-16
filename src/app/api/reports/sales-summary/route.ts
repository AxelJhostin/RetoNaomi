// src/app/api/reports/sales-summary/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; 

export const dynamic = 'force-dynamic';

interface ModifierData {
  id: string;
  name: string;
  price: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Se requieren fechas de inicio y fin' }, { status: 400 });
    }
    
    const startDateISO = new Date(startDate);
    const endDateISO = new Date(endDate);
    endDateISO.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        status: {
          // --- CORRECCIÓN 1: Usamos solo estados de orden válidos ---
          in: ['DELIVERED', 'CLOSED'],
        },
        createdAt: {
          gte: startDateISO,
          lte: endDateISO,
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

    let totalRevenue = 0;
    const productSales: { [key: string]: { name: string, count: number, revenue: number } } = {};
    const modifierSales: { [key: string]: { name: string, count: number, revenue: number } } = {};

    // --- CORRECCIÓN 3: Le damos el tipo correcto a 'order' para que TypeScript entienda que tiene 'items' ---
    for (const order of orders as (Prisma.OrderGetPayload<{include: {items: {include: {product: true}}}}>)[]) {
      totalRevenue += order.total;

      for (const item of order.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.product.name, count: 0, revenue: 0 };
        }
        productSales[item.productId].count += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
        
        if (Array.isArray(item.selectedModifiers)) {
          // --- CORRECCIÓN 4: Usamos nuestro tipo seguro en lugar de 'any' ---
          for (const modifier of item.selectedModifiers as unknown as ModifierData[]) {
            if (modifier && modifier.id) {
              if (!modifierSales[modifier.id]) {
                modifierSales[modifier.id] = { name: modifier.name, count: 0, revenue: 0 };
              }
              modifierSales[modifier.id].count += item.quantity;
              modifierSales[modifier.id].revenue += modifier.price * item.quantity;
            }
          }
        }
      }
    }

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const topProducts = Object.values(productSales).sort((a, b) => b.count - a.count);
    const topModifiers = Object.values(modifierSales).sort((a, b) => b.count - a.count);

    const summary = {
      kpis: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
      },
      topProducts,
      topModifiers,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error generando el reporte de ventas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}