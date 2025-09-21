// src/components/reports/TopProductsChart.tsx
'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

// Registramos los componentes necesarios para un gráfico de pastel
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface TopProduct {
  name: string;
  count: number;
  revenue: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
}

export default function TopProductsChart({ data: topProducts }: TopProductsChartProps) {
  const chartData = {
    labels: topProducts.map(p => p.name), // Nombres de los productos
    datasets: [
      {
        label: '# de Ventas',
        data: topProducts.map(p => p.count), // Cantidad vendida
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(255, 255, 255, 1)',
        ],
        borderWidth: 2,
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
        text: 'Productos Más Vendidos (por cantidad)',
        font: {
          size: 18,
        }
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}