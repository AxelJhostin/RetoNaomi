// src/app/dashboard/page.tsx
import ProductManager from '@/components/ProductManager';
import StaffManager from '@/components/StaffManager';
import TableManager from '@/components/TableManager';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl mb-8 text-right">
        <Link href="/dashboard/reports" className="rounded-md bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700">
          Ver Reporte de Ventas
        </Link>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* --- Columna Izquierda --- */}
        <div className="flex flex-col gap-8">
          <ProductManager />
        </div>

        {/* --- Columna Derecha --- */}
        <div className="flex flex-col gap-8">
          <StaffManager />
          <TableManager />
        </div>

      </div>
    </main>
  );
}