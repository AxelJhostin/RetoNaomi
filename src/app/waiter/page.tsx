// src/app/waiter/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Table {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLING';
}

export default function WaiterPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Esta función obtiene las mesas desde la API que ya habíamos creado
    const fetchTables = async () => {
      try {
        const res = await fetch('/api/tables');
        if (!res.ok) throw new Error('No se pudieron cargar las mesas');
        const data = await res.json();
        setTables(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/staff/logout', { method: 'POST' });
    router.push('/staff-login');
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vista de Mesero</h1>
        <button 
          onClick={handleLogout}
          className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Cerrar Sesión
        </button>
      </header>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Seleccionar Mesa</h2>
        {isLoading ? (
          <p>Cargando mesas...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              <button key={table.id} className="aspect-square rounded-lg flex flex-col justify-center items-center transition-transform hover:scale-105 bg-green-500 text-white">
                <span className="text-xl font-bold">{table.name}</span>
                <span className="text-xs uppercase">{table.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}