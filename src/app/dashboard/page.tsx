// src/app/dashboard/page.tsx
'use client';

import ProductManager from '@/components/dashboard/ProductManager';
import StaffManager from '@/components/dashboard/StaffManager';
import TableManager from '@/components/dashboard/TableManager';
import RoleManager  from '@/components/dashboard/RoleManager';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter(); 

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login'); // Redirigimos al login si todo fue bien
      } else {
        throw new Error('Error al cerrar sesión');
      }
    } catch (error) {
      console.error(error);
      alert('No se pudo cerrar la sesión.');
    }
  };


  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl mb-8 text-right">
        <div className="flex justify-end gap-4 mb-8">
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
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* --- Columna Izquierda --- */}
        <div className="flex flex-col gap-8">
          <ProductManager />
        </div>

        {/* --- Columna Derecha --- */}
        <div className="flex flex-col gap-8">
          <RoleManager />
          <StaffManager />
          <TableManager />
        </div>

      </div>
    </main>
  );
}