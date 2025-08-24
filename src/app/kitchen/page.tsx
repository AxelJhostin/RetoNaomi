'use client';
import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';

interface OrderItem { id: string; quantity: number; product: { name: string }; }
interface Order { id: string; table: { name: string }; items: OrderItem[]; status: string; }

interface KitchenPayload {
  type: 'new' | 'update';
  data: Order;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/kitchen/orders');
        const data = await res.json();
        setOrders(data);
      } catch (error) { console.error(error); } 
      finally { setIsLoading(false); }
    };
    fetchOrders();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('kitchen-channel');

    // --- ¡CAMBIO AQUÍ! ---
    // Un único "oyente" para todos los eventos de la cocina
    channel.bind('kitchen-update', (payload: KitchenPayload) => {
      if (payload.type === 'new') {
        // Si es un pedido nuevo, lo añadimos
        setOrders((prev) => [...prev, payload.data]);
      } else if (payload.type === 'update') {
        // Si es una actualización
        setOrders((prev) => 
          // Si el estado es READY, lo quitamos. Si no, lo actualizamos.
          payload.data.status === 'READY'
            ? prev.filter(order => order.id !== payload.data.id)
            : prev.map(order => order.id === payload.data.id ? payload.data : order)
        );
      }
    });

    return () => {
      pusher.unsubscribe('kitchen-channel');
      pusher.disconnect();
    };
  }, []);

  const handleMarkAsReady = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY' }),
      });
    } catch (error) { console.error("Error al marcar como listo:", error); }
  };

  return (
    <main className="min-h-screen bg-gray-800 text-white p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center">Cocina</h1>
      </header>
      {isLoading ? (<p>Cargando...</p>) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.length > 0 ? orders.map(order => (
            <div key={order.id} className="bg-white text-black rounded-lg p-4 flex flex-col">
              <h2 className="text-xl font-bold mb-2">Mesa: {order.table.name}</h2>
              <ul className="border-t border-b py-2 my-2 flex-grow">
                {order.items.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.quantity}x</span>
                    <span className="flex-grow px-2">{item.product.name}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleMarkAsReady(order.id)}
                className="w-full bg-green-500 text-white p-2 rounded-md mt-2 font-bold hover:bg-green-600"
              >
                Marcar como Listo
              </button>
            </div>
          )) : <p className="text-gray-400 col-span-full text-center">No hay pedidos pendientes.</p>}
        </div>
      )}
    </main>
  );
}