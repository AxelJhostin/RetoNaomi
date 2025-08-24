// src/components/dashboard/SalesReport.tsx
'use client';
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ReportData {
  totalSales: number;
  orderCount: number;
  topProducts: { name: string; count: number }[];
}

// Función para obtener la fecha en formato YYYY-MM-DD
const getISODate = (date: Date) => date.toISOString().split('T')[0];

export default function SalesReport() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // --- ¡NUEVOS ESTADOS PARA LAS FECHAS! ---
  const [startDate, setStartDate] = useState(getISODate(new Date()));
  const [endDate, setEndDate] = useState(getISODate(new Date()));

  // Usamos useCallback para que la función no se recree en cada render
  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      // ¡Añadimos las fechas a la URL de la API!
      const res = await fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]); // Se volverá a crear si las fechas cambian

  // useEffect ahora depende de fetchReport, así que se ejecuta cuando las fechas cambian
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>

        {/* --- ¡NUEVOS CONTROLES DE FECHA! --- */}
        <div className="flex items-center gap-4">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm"
            />
            <span>hasta</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm"
            />
        </div>
        <Link href="/dashboard" className="text-blue-600 hover:underline self-end">
          &larr; Volver al Dashboard
        </Link>
      </div>

      {isLoading ? (
        <p>Generando reporte...</p>
      ) : !report ? (
        <p>No se pudo generar el reporte.</p>
      ) : (
        <>
          {/* Tarjetas de Resumen (sin cambios) */}
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

          {/* Lista de Productos Más Vendidos (sin cambios) */}
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
              <p>No hay ventas registradas en este período.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}