// src/app/dashboard/page.tsx
'use client';

// --- CAMBIO: Añadimos useState, useEffect y useCallback ---
import { useState, useEffect, useCallback } from 'react'; 
import ProductManager from '@/components/dashboard/ProductManager';
import StaffManager from '@/components/dashboard/StaffManager';
import TableManager from '@/components/dashboard/TableManager';
import RoleManager  from '@/components/dashboard/RoleManager';
import CategoryManager from '@/components/dashboard/CategoryManager';
import ProductList from '@/components/dashboard/ProductList';
import SalesChart from '@/components/reports/SalesChart';
import AIAdvisor from '@/components/dashboard/AIAdvisor';
import TopProductsChart from '@/components/reports/TopProductsChart';


import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
// --- Mantenemos la interfaz aquí, en el "gerente" ---
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { name: string } | null;
}

export default function DashboardPage() {
  const router = useRouter(); 

  // --- NUEVO: El estado de los productos ahora vive aquí ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // --- NUEVO: La función para buscar productos ahora vive aquí ---
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []); // useCallback con array vacío para que la función no se recree
  // --- NUEVO: La función para buscar datos del reporte ahora vive aquí ---
   const fetchChartData = useCallback(async () => {
    // Calculamos el rango de fechas: desde hace 7 días hasta hoy
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    // Formateamos las fechas a YYYY-MM-DD
    const format = (d: Date) => d.toISOString().split('T')[0];

    try {
      const res = await fetch(`/api/reports/sales-summary?startDate=${format(startDate)}&endDate=${format(endDate)}`);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchChartData();
  }, [fetchProducts, fetchChartData]);

  // --- NUEVO: La función para borrar productos ahora vive aquí ---
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      fetchProducts(); // Llama a la función del "gerente" para refrescar
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    // ... tu función de logout se queda igual ...
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        
        <div className="flex justify-end gap-4 mb-8">
          <Link href="/dashboard/sales-report">
            <button className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700">
                Ver Ventas del Día
            </button>
          </Link>
          <Link href="/dashboard/reports">
            <button className="rounded-md bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700">
              Ver Reporte de Ventas
            </button>
          </Link>
          <button 
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* --- LAYOUT CORREGIDO --- */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Columna Izquierda */}
          <div className="flex flex-col gap-8">
            <ProductManager onProductAdded={fetchProducts} />
            <ProductList 
              products={products}
              isLoading={isLoadingProducts}
              onDelete={handleDeleteProduct}
            />
            <StaffManager />
            <TableManager />
          </div>

          {/* Columna Derecha */}
          <div className="flex flex-col gap-8">
            {/* Gráficos movidos aquí */}
            {reportData && (
              <>
                {reportData.salesByDay && reportData.salesByDay.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <SalesChart data={reportData.salesByDay} />
                  </div>
                )}
                {reportData.topProducts && reportData.topProducts.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <TopProductsChart data={reportData.topProducts} />
                  </div>
                )}
                <AIAdvisor reportData={reportData} />
              </>
            )}
            
            <CategoryManager />
            <RoleManager />
            
          </div>
        </div>
      </div>
    </main>
  );
}
// Hernandez Menendez Axel Jhostin estuba aqui, no lo olvides