//src/app/waiter/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

// --- Definición de Tipos ---
interface Table {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLING';
  isFoodReady?: boolean; // Nuevo estado para la alerta visual
  activeOrderId: string | null;
  orderTotal: number;
}

// --- Componente de la Página de Mesero ---
export default function WaiterPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [waiterName, setWaiterName] = useState<string>('');
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
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/staff/me');
        const data = await res.json();
        if (res.ok) {
          setWaiterName(data.user.name);
        }
      } catch (error) {
        console.error("No se pudo obtener el usuario actual", error);
      }
    };
    fetchCurrentUser();
    fetchTables();

    // --- Lógica de Pusher para recibir notificaciones ---
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const waiterChannel = pusher.subscribe('waiter-channel');
    
    // Escuchamos el evento 'order-ready' que envía la cocina
    waiterChannel.bind('order-ready', (data: { tableId: string }) => {
      setTables((currentTables) =>
        currentTables.map((t) =>
          t.id === data.tableId ? { ...t, isFoodReady: true } : t
        )
      );
    });
    
    // (Aquí podrías añadir más listeners en el futuro, como 'table-update')

    return () => {
      pusher.unsubscribe('waiter-channel');
      pusher.disconnect();
    };
  }, [fetchTables]);

  const handleLogout = async () => {
    await fetch('/api/staff/logout', { method: 'POST' });
    router.push('/staff-login');
  };

  const handleTableClick = async (table: Table) => {
    // Si la comida está lista, al hacer clic quitamos la alerta visual
    if (table.isFoodReady) {
        setTables(prev => prev.map(t => t.id === table.id ? {...t, isFoodReady: false} : t));
    }
    
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
      // Después de cobrar, refrescamos el estado de las mesas
      fetchTables(); 
    } catch (error) {
      console.error(error);
      alert('Error al cobrar el pedido.');
    }
  };

  // Función para determinar el estilo y texto de la mesa
  const getTableStyle = (table: Table) => {
    if (table.isFoodReady) {
      return 'bg-yellow-400 animate-pulse';
    }
    switch (table.status) {
      case 'OCCUPIED':
        return 'bg-orange-500';
      case 'BILLING':
        return 'bg-purple-600';
      case 'AVAILABLE':
      default:
        return 'bg-green-500';
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          Mesero: <span className="text-blue-600">{waiterName || 'Cargando...'}</span>
        </h1>
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
                  className={`aspect-square rounded-lg flex flex-col justify-center items-center text-white transition-transform hover:scale-105 ${getTableStyle(table)}`}
                >
                  <span className="text-xl font-bold">{table.name}</span>
                  {/* Si el total es mayor a 0, lo mostramos. Si no, mostramos el estado. */}
                  {table.orderTotal > 0 ? (
                    <span className="mt-1 text-sm font-semibold bg-black bg-opacity-20 px-2 py-1 rounded">
                      {new Intl.NumberFormat('es-EC', { 
                        style: 'currency', 
                        currency: 'USD' 
                      }).format(table.orderTotal)}
                    </span>
                  ) : (
                    <span className="text-xs uppercase">{table.status}</span>
                  )}

                  {/* La alerta de "Comida Lista" se muestra de forma independiente si es necesario */}
                  {table.isFoodReady && (
                    <span className="mt-1 text-xs uppercase font-bold text-black">
                      COMIDA LISTA
                    </span>
                  )}
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