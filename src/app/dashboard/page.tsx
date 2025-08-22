// src/app/dashboard/page.tsx
import ProductManager from '@/components/ProductManager';
import StaffManager from '@/components/StaffManager';
import TableManager from '@/components/TableManager';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
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