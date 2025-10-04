// src/app/waiter/my-invoices/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Usamos Link para una mejor navegación

// Definimos un tipo para los datos que esperamos de la API
interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  invoiceData: {
    financialSummary: {
      grandTotal: number;
    };
  };
  order: {
    table: {
      name: string;
    };
  };
}

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/staff/my-invoices');
        if (!res.ok) {
          // Si la sesión expiró o hay otro error, volvemos al login
          router.push('/staff-login');
          return;
        }
        const data = await res.json();
        setInvoices(data);
      } catch (error) {
        console.error("Error al cargar las facturas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, [router]);

  // Calculamos el total de ventas del día
  const totalSalesToday = invoices.reduce((sum, invoice) => sum + invoice.invoiceData.financialSummary.grandTotal, 0);

  if (isLoading) {
    return <main className="p-8"><p>Cargando mis ventas...</p></main>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mis Ventas del Día</h1>
        <button onClick={() => router.push('/waiter')} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700">
          ‹ Volver a Mesas
        </button>
      </header>
      
      {/* Resumen de Ventas */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700">Total Vendido Hoy</h2>
        <p className="text-3xl font-bold text-green-600 mt-2">
          {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totalSalesToday)}
        </p>
      </div>

      {/* Lista de Facturas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Facturas Emitidas</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-500">Aún no has emitido facturas hoy.</p>
        ) : (
          <ul className="space-y-3">
            {invoices.map(invoice => (
              <li key={invoice.id}>
                <Link href={`/invoice/${invoice.id}`} className="block p-4 border rounded-md hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">Mesa: {invoice.order.table.name}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-semibold text-lg text-blue-600">
                        {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(invoice.invoiceData.financialSummary.grandTotal)}
                       </p>
                       <p className="text-xs text-gray-500">
                        {new Date(invoice.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}