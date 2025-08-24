'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

// --- Definición de Tipos ---
interface Table {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLING';
}
// Tipo para el evento que viene de la cocina
interface OrderUpdatePayload {
  status: string;
  table: Table;
}

// --- Componente de la Página de Mesero ---
export default function WaiterPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
    fetchTables(); // Carga inicial

    // --- Lógica de Pusher para actualizaciones en tiempo real ---
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // 1. Escuchamos el canal de las mesas para saber si una se ocupa, libera, etc.
    const tablesChannel = pusher.subscribe('tables-channel');
    tablesChannel.bind('table-update', (updatedTable: Table) => {
      setTables((currentTables) =>
        currentTables.map((t) => (t.id === updatedTable.id ? updatedTable : t))
      );
    });

    // 2. Escuchamos el canal de la cocina para saber si un pedido está listo
    const kitchenChannel = pusher.subscribe('kitchen-channel');
    kitchenChannel.bind('order-update', (payload: OrderUpdatePayload) => {
      // Cuando un pedido se marca como 'READY', la API nos envía la mesa actualizada
      if (payload.status === 'READY') {
        // Podríamos querer un estado nuevo como 'SERVING' para la mesa aquí
        // Por ahora, solo actualizamos la info de la mesa
        setTables((currentTables) =>
          currentTables.map((t) => (t.id === payload.table.id ? payload.table : t))
        );
      }
    });

    // 3. Limpiamos ambas conexiones al salir
    return () => {
      pusher.unsubscribe('tables-channel');
      pusher.unsubscribe('kitchen-channel');
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

  const handleMarkAsPaid = async (table: Table) => {
    try {
      const res = await fetch(`/api/tables/${table.id}/active-order`);
      if (!res.ok) throw new Error('No se encontró un pedido para cobrar');
      const activeOrder = await res.json();
      await fetch(`/api/orders/${activeOrder.id}/close`, { method: 'POST' });
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