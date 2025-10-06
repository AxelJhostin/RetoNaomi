// src/app/api/invoices/from-split/route.ts
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // <-- CORRECCIÓN AQUÍ
import { NextRequest, NextResponse } from 'next/server';

// ... (El resto del archivo se mantiene exactamente igual) ...
interface SplitItemPayload {
  quantity: number;
  productName: string;
  unitPrice: number;
  modifiers: string[];
  itemTotal: number;
  notes?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, items }: { orderId: string; items: SplitItemPayload[] } = await request.json();

    if (!orderId || !items || items.length === 0) {
      return NextResponse.json({ message: 'Faltan datos para generar la factura' }, { status: 400 });
    }

    const newInvoice = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { 
          table: true,
          staff: { include: { owner: true } } 
        }
      });

      if (!order || !order.staff.owner) {
        throw new Error('No se encontró el pedido o la configuración del restaurante.');
      }
      
      const ownerSettings = order.staff.owner;

      const subtotal = items.reduce((sum: number, item: SplitItemPayload) => sum + item.itemTotal, 0);
      const taxAmount = subtotal * ownerSettings.taxRate;
      const serviceChargeAmount = subtotal * ownerSettings.serviceChargeRate;
      const grandTotal = subtotal + taxAmount + serviceChargeAmount;

      const invoiceCount = await tx.invoice.count();
      const invoiceNumber = `F-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(5, '0')}`;

      const fullInvoiceData = {
        restaurantInfo: {
          name: ownerSettings.restaurantName || 'Nombre no configurado',
          address: ownerSettings.restaurantAddress || 'Dirección no configurada',
          taxId: ownerSettings.taxId || 'RUC no configurado',
        },
        saleInfo: {
          invoiceNumber: invoiceNumber,
          date: new Date().toISOString(),
          waiterName: order.staff.name,
          tableName: order.table.name,
        },
        items: items,
        financialSummary: {
          subtotal,
          taxRate: ownerSettings.taxRate,
          taxAmount,
          serviceChargeRate: ownerSettings.serviceChargeRate,
          serviceChargeAmount,
          grandTotal,
        },
      };

      const createdInvoice = await tx.invoice.create({
        data: {
          orderId: orderId,
          invoiceNumber: invoiceNumber,
          invoiceData: fullInvoiceData as unknown as Prisma.InputJsonValue,// lo que hicimos fue castear el objeto a Prisma.InputJsonValue porque invoiceData es de tipo Json en el modelo de Prisma
        }
      });
      
      return createdInvoice;
    });

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al crear factura desde división:', errorMessage);
    return NextResponse.json({ message: 'Error al generar la factura', error: errorMessage }, { status: 500 });
  }
}