'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js'; // <-- Necesitamos este import para tiempo real

interface Table {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLING';
}

export default function WaiterPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Usamos useCallback para que la función no se recree innecesariamente
  const fetchTables = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchTables(); // Carga inicial de las mesas

    // --- Lógica de Pusher para actualizaciones en tiempo real --- // <--
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe('tables-channel');
    
    // Cuando recibimos un anuncio de 'table-update'
    channel.bind('table-update', (updatedTable: Table) => {
      // Actualizamos la mesa correspondiente en nuestra lista
      setTables((currentTables) =>
        currentTables.map((t) => (t.id === updatedTable.id ? updatedTable : t))
      );
    });

    // Limpiamos la conexión al salir
    return () => {
      pusher.unsubscribe('tables-channel');
      pusher.disconnect();
    };
  }, [fetchTables]);

  const handleLogout = async () => {
    await fetch('/api/staff/logout', { method: 'POST' });
    router.push('/staff-login');
  };

  const handleTableClick = async (table: Table) => {
    try {
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
        const res = await fetch(`/api/tables/${table.id}/active-order`);
        if (!res.ok) throw new Error('No se encontró un pedido activo');
        const activeOrder = await res.json();
        router.push(`/order/${activeOrder.id}`);
      }
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error. Inténtalo de nuevo.');
    }
  };

  // --- NUEVA FUNCIÓN PARA COBRAR --- // <--
  const handleMarkAsPaid = async (table: Table) => {
    try {
      // 1. Encontrar el pedido activo de la mesa
      const res = await fetch(`/api/tables/${table.id}/active-order`);
      if (!res.ok) throw new Error('No se encontró un pedido para cobrar');
      const activeOrder = await res.json();

      // 2. Llamar a la API para cerrar ese pedido
      await fetch(`/api/orders/${activeOrder.id}/close`, { method: 'POST' });
      
      // La UI se actualizará sola gracias a Pusher, no necesitamos hacer nada más aquí.
    } catch (error) {
        console.error(error);
        alert('Error al cobrar el pedido.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vista de Mesero</h1>
        <button onClick={handleLogout} className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600">
          Cerrar Sesión
        </button>
      </header>
      
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Seleccionar Mesa</h2>
        {isLoading ? (<p>Cargando mesas...</p>) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              // --- ESTRUCTURA MODIFICADA PARA EL BOTÓN DE COBRAR --- // <--
              <div key={table.id} className="flex flex-col gap-2">
                <button 
                  onClick={() => handleTableClick(table)}
                  className={`aspect-square rounded-lg flex flex-col justify-center items-center text-white transition-transform hover:scale-105 ${
                    table.status === 'AVAILABLE' ? 'bg-green-500' : 
                    table.status === 'OCCUPIED' ? 'bg-orange-500' : 'bg-purple-600'
                  }`}
                >
                  <span className="text-xl font-bold">{table.name}</span>
                  <span className="text-xs uppercase">{table.status}</span>
                </button>
                {/* Mostramos el botón de Cobrar solo si la mesa está en estado BILLING */}
                {table.status === 'BILLING' && (
                  <button 
                    onClick={() => handleMarkAsPaid(table)}
                    className="w-full rounded-md bg-teal-500 text-white p-2 text-sm font-bold hover:bg-teal-600"
                  >
                    Cobrar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}