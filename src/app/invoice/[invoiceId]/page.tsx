// src/app/invoice/[invoiceId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Definimos un tipo para los datos de la factura que esperamos
type InvoiceData = {
  restaurantInfo: { name: string; address: string; taxId: string; };
  saleInfo: { invoiceNumber: string; date: string; waiterName: string; tableName: string; };
  items: { quantity: number; productName: string; unitPrice: number; modifiers: string[]; itemTotal: number; }[];
  financialSummary: { subtotal: number; taxRate: number; taxAmount: number; serviceChargeRate: number; serviceChargeAmount: number; grandTotal: number; };
};

export default function InvoicePage() {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  useEffect(() => {
    if (invoiceId) {
      fetch(`/api/invoices/${invoiceId}`)
        .then(res => {
          if (!res.ok) throw new Error('No se pudo cargar la factura.');
          return res.json();
        })
        .then(data => {
          // El JSON que guardamos está en el campo 'invoiceData'
          setInvoice(data.invoiceData);
        })
        .catch(err => {
          console.error(err);
          // Si hay un error, enviamos al mesero de vuelta
          router.push('/waiter');
        })
        .finally(() => setIsLoading(false));
    }
  }, [invoiceId, router]);

  // Función para el botón de imprimir
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><p>Cargando factura...</p></div>;
  if (!invoice) return <div className="flex justify-center items-center h-screen"><p>Factura no encontrada.</p></div>;

  return (
    <main className="bg-gray-100 flex flex-col items-center justify-center min-h-screen p-4 print:bg-white">
      {/* Contenedor del Recibo */}
      <div className="w-full max-w-md bg-white shadow-lg p-6 font-mono text-sm">
        {/* Encabezado */}
        <header className="text-center mb-6 border-b pb-4">
          <h1 className="text-xl font-bold uppercase">{invoice.restaurantInfo.name}</h1>
          <p>{invoice.restaurantInfo.address}</p>
          <p>RUC: {invoice.restaurantInfo.taxId}</p>
        </header>

        {/* Detalles de la Venta */}
        <section className="mb-6 text-xs">
          <div className="flex justify-between"><span>Factura #:</span> <span>{invoice.saleInfo.invoiceNumber}</span></div>
          <div className="flex justify-between"><span>Fecha:</span> <span>{new Date(invoice.saleInfo.date).toLocaleString('es-EC')}</span></div>
          <div className="flex justify-between"><span>Mesero:</span> <span>{invoice.saleInfo.waiterName}</span></div>
          <div className="flex justify-between"><span>Mesa:</span> <span>{invoice.saleInfo.tableName}</span></div>
        </section>

        {/* Cuerpo con Items */}
        <section className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-1">Cant.</th>
                <th className="text-left pb-1">Descripción</th>
                <th className="text-right pb-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-dashed">
                  <td className="py-2 align-top">{item.quantity}x</td>
                  <td className="py-2">
                    {item.productName}
                    {item.modifiers.length > 0 && (
                      <div className="text-gray-600 text-xs pl-2">
                        {item.modifiers.map(mod => `+ ${mod}`).join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="py-2 text-right align-top">${item.itemTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Resumen Financiero */}
        <section className="mb-6 text-xs">
          <div className="flex justify-between"><span>Subtotal:</span> <span>${invoice.financialSummary.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>IVA ({invoice.financialSummary.taxRate * 100}%):</span> <span>${invoice.financialSummary.taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Servicio ({invoice.financialSummary.serviceChargeRate * 100}%):</span> <span>${invoice.financialSummary.serviceChargeAmount.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base border-t mt-2 pt-2"><span>TOTAL:</span> <span>${invoice.financialSummary.grandTotal.toFixed(2)}</span></div>
        </section>

        {/* Pie de Página */}
        <footer className="text-center text-xs pt-4 border-t">
          <p>¡Gracias por su visita!</p>
        </footer>
      </div>

      {/* Botones de Acción (se ocultan al imprimir) */}
      <div className="w-full max-w-md mt-6 flex gap-4 print:hidden">
        <button onClick={() => router.push('/waiter')} className="w-full bg-gray-500 text-white p-3 rounded-lg font-bold hover:bg-gray-600">Volver a Mesas</button>
        <button onClick={handlePrint} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">Imprimir</button>
      </div>
    </main>
  );
}