// src/app/dashboard/sales-report/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    table: { name: string; };
    staff: { name: string; };
  };
}

export default function SalesReportPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const router = useRouter();

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/invoices/by-date?date=${selectedDate}`);
        if (!res.ok) {
          if (res.status === 401) router.push('/login'); // Redirigir si no está autorizado
          throw new Error('No se pudieron cargar las facturas');
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
  }, [selectedDate, router]);

  // --- Calculamos los KPIs (Indicadores Clave de Rendimiento) ---
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.invoiceData.financialSummary.grandTotal, 0);
  const totalInvoices = invoices.length;
  const averageSale = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  return (
    <div className="p-8">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">Reporte de Ventas</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="date-picker" className="font-semibold">Seleccionar Fecha:</label>
          <input
            id="date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded-md"
          />
        </div>
      </header>

      {/* Tarjetas de KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Ventas Totales</h3>
          <p className="text-3xl font-bold mt-2">
            {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Nº de Facturas</h3>
          <p className="text-3xl font-bold mt-2">{totalInvoices}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Venta Promedio</h3>
          <p className="text-3xl font-bold mt-2">
            {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(averageSale)}
          </p>
        </div>
      </section>

      {/* Tabla de Facturas */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Detalle de Facturas</h2>
        {isLoading ? (<p>Cargando...</p>) :
         invoices.length === 0 ? (<p className="text-gray-500">No se encontraron ventas para esta fecha.</p>) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Factura #</th>
                  <th className="p-3">Hora</th>
                  <th className="p-3">Mesero</th>
                  <th className="p-3">Mesa</th>
                  <th className="p-3 text-right">Monto Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-blue-600">
                      <Link href={`/invoice/${invoice.id}`} target="_blank">{invoice.invoiceNumber}</Link>
                    </td>
                    <td className="p-3">{new Date(invoice.createdAt).toLocaleTimeString('es-EC')}</td>
                    <td className="p-3">{invoice.order.staff.name}</td>
                    <td className="p-3">{invoice.order.table.name}</td>
                    <td className="p-3 text-right font-semibold">
                      {new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(invoice.invoiceData.financialSummary.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}