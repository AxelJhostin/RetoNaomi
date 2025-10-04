// src/app/api/tables/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { OrderStatus } from '@prisma/client';

// Definición de tipo para los modificadores para hacer el código más seguro
type SelectedModifier = {
  name: string;
  price: number;
  id: string;
};

// Función para OBTENER las mesas
export async function GET(request: NextRequest) {
  try {
    // --- Mantenemos toda tu lógica de autenticación intacta ---
    const ownerToken = request.cookies.get('token')?.value;
    const staffToken = request.cookies.get('staff_token')?.value;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    let ownerId: string | null = null;

    if (ownerToken) {
      const { payload } = await jwtVerify(ownerToken, secret);
      ownerId = payload.id as string;
    } else if (staffToken) {
      const { payload } = await jwtVerify(staffToken, secret);
      ownerId = payload.ownerId as string;
    }

    if (!ownerId) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    // --- Fin de la lógica de autenticación ---


    // --- 2. CONSULTA A LA BASE DE DATOS MEJORADA ---
    const tables = await prisma.table.findMany({
      where: { ownerId: ownerId },
      orderBy: { name: 'asc' },
      include: { // Incluimos los pedidos asociados a cada mesa
        orders: {
          where: { // Solo los pedidos que están activos
            status: {
              in: [OrderStatus.OPEN, OrderStatus.COOKING, OrderStatus.READY],
            },
          },
          include: {
            items: true, // Y de esos pedidos, incluimos sus ítems
          },
        },
      },
    });


    // --- 3. CÁLCULO DEL TOTAL EN EL SERVIDOR ---
    const tablesWithTotal = tables.map((table) => {
      const activeOrder = table.orders[0]; // Solo debería haber un pedido activo a la vez
      let orderTotal = 0;

      if (activeOrder) {
        orderTotal = activeOrder.items.reduce((total, item) => {
          const modifiersTotal = (item.selectedModifiers as SelectedModifier[]).reduce(
            (modifierSum, modifier) => modifierSum + modifier.price,
            0
          );
          return total + item.price + modifiersTotal;
        }, 0);
      }

      return {
        id: table.id,
        name: table.name,
        status: table.status,
        activeOrderId: activeOrder ? activeOrder.id : null,
        orderTotal: orderTotal,
      };
    });

    return NextResponse.json(tablesWithTotal, { status: 200 });

  } catch (error) {
    // Tu manejo de errores se mantiene igual
    console.error("Error en GET /api/tables:", error);
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}

// Función para CREAR una nueva mesa
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const newTable = await prisma.table.create({
      data: {
        name,
        ownerId: userId,
      },
    });

    return NextResponse.json(newTable, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Ocurrió un error' }, { status: 500 });
  }
}