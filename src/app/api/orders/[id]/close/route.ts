// src/app/api/orders/[id]/close/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { type OrderItem, type Product } from '@prisma/client';

// Definimos el tipo para los modificadores dentro del JSON
type SelectedModifier = { name: string; price: number; };

type OrderItemWithProduct = OrderItem & {
  product: Product;
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;

    const newInvoice = await prisma.$transaction(async (tx) => {
      // 1. Obtenemos TODOS los datos necesarios para la factura en una sola consulta
      const orderToClose = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          table: true,
          staff: {
            include: {
              owner: true, // ¡Crucial! Para obtener la configuración del restaurante
            }
          },
          items: {
            include: {
              product: true,
            }
          }
        }
      });

      if (!orderToClose || !orderToClose.staff.owner) {
        throw new Error('No se encontró el pedido o la configuración del restaurante.');
      }

      // 2. Generamos un número de factura único y secuencial
      const invoiceCount = await tx.invoice.count();
      const invoiceNumber = `F-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(5, '0')}`;

      // 3. Realizamos los cálculos financieros
      const ownerSettings = orderToClose.staff.owner;
      const subtotal = orderToClose.total; // Usamos el total que ya has calculado
      const taxAmount = subtotal * ownerSettings.taxRate;
      const serviceChargeAmount = subtotal * ownerSettings.serviceChargeRate;
      const grandTotal = subtotal + taxAmount + serviceChargeAmount;

      // 4. Construimos la "fotografía" de la venta (el objeto JSON)
      const invoiceData = {
        restaurantInfo: {
          name: ownerSettings.restaurantName || 'Nombre no configurado',
          address: ownerSettings.restaurantAddress || 'Dirección no configurada',
          taxId: ownerSettings.taxId || 'RUC no configurado',
        },
        saleInfo: {
          invoiceNumber: invoiceNumber,
          date: new Date().toISOString(),
          waiterName: orderToClose.staff.name,
          tableName: orderToClose.table.name,
        },
        items: orderToClose.items.map((item: OrderItemWithProduct) => ({
          quantity: item.quantity,
          productName: item.product.name,
          unitPrice: item.price,
          modifiers: ((item.selectedModifiers as SelectedModifier[]) || []).map(mod => mod.name),
          itemTotal: (item.price + ((item.selectedModifiers as SelectedModifier[]) || []).reduce((sum, mod) => sum + mod.price, 0)) * item.quantity,
        })),
        financialSummary: {
          subtotal: subtotal,
          taxRate: ownerSettings.taxRate,
          taxAmount: taxAmount,
          serviceChargeRate: ownerSettings.serviceChargeRate,
          serviceChargeAmount: serviceChargeAmount,
          grandTotal: grandTotal,
        },
      };

      // 5. Creamos la factura en la base de datos
      const createdInvoice = await tx.invoice.create({
        data: {
          orderId: orderId,
          invoiceNumber: invoiceNumber,
          invoiceData: invoiceData, // Guardamos el objeto JSON completo
        }
      });

      // 6. Actualizamos el pedido a 'CLOSED'
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CLOSED' },
      });

      // 7. Actualizamos la mesa a 'AVAILABLE'
      await tx.table.update({
        where: { id: orderToClose.tableId },
        data: { status: 'AVAILABLE' },
      });
      
      // Notificamos a los meseros que la mesa se liberó
      await pusherServer.trigger('tables-channel', 'table-update', { id: orderToClose.tableId, status: 'AVAILABLE' });

      return createdInvoice;
    });

    return NextResponse.json(newInvoice, { status: 201 }); // Devolvemos la factura creada

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al cerrar el pedido y generar la factura:', errorMessage);
    return NextResponse.json({ message: 'Error al generar la factura', error: errorMessage }, { status: 500 });
  }
}