// src/components/reports/SalesChart.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registramos los componentes necesarios para un gráfico de líneas
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  data: {
    date: string;
    total: number;
  }[];
}

export default function SalesChart({ data: salesData }: SalesChartProps) {
  const chartData = {
    labels: salesData.map(d => new Date(d.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Ingresos por Día',
        data: salesData.map(d => d.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución de Ingresos',
        font: {
          size: 18,
        }
      },
    },
  };

  return <Line options={options} data={chartData} />;
}