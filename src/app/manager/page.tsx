// src/app/manager/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserPayload {
  name: string;
}

export default function ManagerDashboard() {
  const [manager, setManager] = useState<UserPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Obtenemos los datos del gerente que ha iniciado sesión
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/staff/me');
        if (!res.ok) throw new Error('No se pudo obtener el usuario');
        const data = await res.json();
        setManager(data.user);
      } catch (error) {
        console.error("Error fetching current user:", error);
        router.push('/staff-login'); // Si hay error, lo sacamos
      }
    };
    fetchCurrentUser();
  }, [router]);
  
  const handleLogout = async () => {
    await fetch('/api/staff/logout', { method: 'POST' });
    router.push('/staff-login');
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">Panel de Gerente</h1>
          <p className="text-gray-600">
            Bienvenido, <span className="font-semibold">{manager?.name || '...'}</span>
          </p>
        </div>
        <button 
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-white font-semibold hover:bg-red-700"
        >
          Cerrar Sesión
        </button>
      </header>
      
      <section>
        <h2 className="text-2xl font-semibold mb-6">Herramientas de Gestión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta para el Reporte de Ventas */}
          <Link href="/dashboard/sales-report" className="block bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-blue-600">Reporte de Ventas</h3>
            <p className="mt-2 text-gray-600">Visualiza las facturas y el rendimiento de ventas por día.</p>
          </Link>

          {/* Aquí podemos añadir más tarjetas en el futuro */}
          {/* Tarjeta para la Gestión de Personal */}
        <Link href="/manager/staff" className="block bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold text-green-600">Gestión de Personal</h3>
            <p className="mt-2 text-gray-600">Añade, edita o elimina miembros del personal y gestiona sus roles.</p>
        </Link>
          
          <div className="bg-gray-200 p-6 rounded-lg shadow flex items-center justify-center">
            <p className="text-gray-500 text-center">Próximamente: Gestión de Productos</p>
          </div>

        </div>
      </section>
    </main>
  );
}