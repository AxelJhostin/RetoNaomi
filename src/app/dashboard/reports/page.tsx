// src/app/dashboard/reports/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

// --- Definimos los tipos para los datos del reporte ---
interface Kpis {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}
interface TopProduct {
  name: string;
  count: number;
  revenue: number;
}
interface TopModifier {
  name: string;
  count: number;
  revenue: number;
}
interface ReportData {
  kpis: Kpis;
  topProducts: TopProduct[];
  topModifiers: TopModifier[];
}

export default function ReportsPage() {
  // --- Estados para manejar las fechas y los datos ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Función para generar el reporte ---
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor, selecciona un rango de fechas.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const res = await fetch(`/api/reports/sales-summary?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) {
        throw new Error('No se pudo generar el reporte.');
      }
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reporte de Ventas</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            &larr; Volver al Dashboard
          </Link>
        </div>

        {/* --- Selector de Fechas --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div className="flex-1 w-full">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <button onClick={handleGenerateReport} disabled={isLoading} className="w-full sm:w-auto mt-4 sm:mt-0 rounded-md bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-400">
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>

        {error && <p className="text-center text-red-500 mb-4">{error}</p>}
        
        {/* --- Resultados del Reporte --- */}
        {reportData && (
          <div className="space-y-8">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg text-gray-500">Ingresos Totales</h3>
                <p className="text-3xl font-bold font-mono">${reportData.kpis.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg text-gray-500">Total de Órdenes</h3>
                <p className="text-3xl font-bold font-mono">{reportData.kpis.totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-lg text-gray-500">Promedio por Orden</h3>
                <p className="text-3xl font-bold font-mono">${reportData.kpis.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Top Productos y Modificadores */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Productos Más Vendidos</h3>
                <ul className="space-y-2">
                  {reportData.topProducts.map(product => (
                    <li key={product.name} className="flex justify-between border-b pb-1">
                      <span>{product.count}x {product.name}</span>
                      <span className="font-mono">${product.revenue.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Modificadores Más Populares</h3>
                <ul className="space-y-2">
                  {reportData.topModifiers.map(mod => (
                    <li key={mod.name} className="flex justify-between border-b pb-1">
                      <span>{mod.count}x {mod.name}</span>
                      <span className="font-mono">${mod.revenue.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}