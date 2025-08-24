// src/components/dashboard/SalesReport.tsx
'use client';
import { useState, useEffect } from "react";
import Link from "next/link";

interface ReportData {
  totalSales: number;
  orderCount: number;
  topProducts: { name: string; count: number }[];
}

export default function SalesReport() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch('/api/reports/sales');
        const data = await res.json();
        setReport(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (isLoading) return <p>Generando reporte...</p>;
  if (!report) return <p>No se pudo generar el reporte.</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          &larr; Volver al Dashboard
        </Link>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-sm font-medium text-gray-500">VENTAS TOTALES</h2>
          <p className="mt-1 text-3xl font-semibold text-gray-900">${report.totalSales.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-sm font-medium text-gray-500">PEDIDOS COMPLETADOS</h2>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{report.orderCount}</p>
        </div>
      </div>

      {/* Lista de Productos Más Vendidos */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Productos Más Vendidos</h2>
        {report.topProducts.length > 0 ? (
          <ul>
            {report.topProducts.map((product, index) => (
              <li key={index} className="flex justify-between items-center border-b py-3 last:border-none">
                <span className="font-medium text-gray-800">{product.name}</span>
                <span className="font-semibold text-gray-600">{product.count} vendidos</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay ventas registradas.</p>
        )}
      </div>
    </div>
  );
}