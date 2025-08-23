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

  const handleTableClick = async (table: Table) => {
  try {
    // Si la mesa está disponible, crea un nuevo pedido
    if (table.status === 'AVAILABLE') {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: table.id }),
      });
      if (!res.ok) throw new Error('No se pudo crear el pedido');
      const newOrder = await res.json();
      router.push(`/order/${newOrder.id}`);
    } else {
      // Si la mesa está ocupada o cobrando, busca su pedido activo
      const res = await fetch(`/api/tables/${table.id}/active-order`);
      if (!res.ok) throw new Error('No se encontró un pedido activo para esta mesa');
      const activeOrder = await res.json();
      router.push(`/order/${activeOrder.id}`);
    }
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error. Inténtalo de nuevo.');
  }
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
              <button 
                key={table.id}
                // --- 1. Se añade la función para manejar el clic ---
                onClick={() => handleTableClick(table)}
                // --- 2. El color cambia según el estado y se deshabilita si no está disponible ---
                className={`aspect-square rounded-lg flex flex-col justify-center items-center text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  table.status === 'AVAILABLE' ? 'bg-green-500' : 
                  table.status === 'OCCUPIED' ? 'bg-orange-500' : 'bg-purple-500' // <-- Cambio aquí
                }`}
              >
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