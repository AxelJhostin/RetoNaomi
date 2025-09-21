// src/components/dashboard/AIAdvisor.tsx
'use client';

import { useState } from 'react';

// --- DEFINIMOS LOS TIPOS ESPECÍFICOS QUE FALTABAN ---
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
  salesByDay: { date: string; total: number }[];
}
// --------------------------------------------------

interface AIAdvisorProps {
  reportData: ReportData | null;
}

export default function AIAdvisor({ reportData }: AIAdvisorProps) {
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getRecommendations = async () => {
    if (!reportData) {
      setError('Primero deben cargarse los datos del reporte.');
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendations('');

    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!res.ok) {
        throw new Error('No se pudieron generar las recomendaciones.');
      }
      
      const data = await res.json();
      setRecommendations(data.recommendations);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">Asesor de Negocios IA</h2>
      <p className="text-sm text-gray-600 mb-4">
        Usa los datos de ventas de los últimos 7 días para generar recomendaciones y mejorar tu restaurante.
      </p>
      
      <button 
        onClick={getRecommendations}
        disabled={isLoading || !reportData}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Analizando...' : 'Generar Consejos'}
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {recommendations && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold mb-2">Recomendaciones:</h3>
          <div className="text-sm text-gray-800 bg-indigo-50 p-4 rounded-md whitespace-pre-line prose">
            {recommendations}
          </div>
        </div>
      )}
    </div>
  );
}