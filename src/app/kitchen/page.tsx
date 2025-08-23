'use client';
import { useState, useEffect } from 'react';
import Pusher from 'pusher-js';

// --- Definición de Tipos ---
interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
}
interface Order {
  id: string;
  table: { name: string };
  items: OrderItem[];
  status: string;
}

// --- Componente de la Página de Cocina ---
export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Efecto para Cargar Datos y Escuchar en Tiempo Real ---
  useEffect(() => {
    // 1. Carga los pedidos iniciales al abrir la página
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/kitchen/orders');
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();

    // 2. Se conecta a Pusher para escuchar actualizaciones
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('kitchen-channel');

    // Escucha por nuevos pedidos enviados por los meseros
    channel.bind('new-order', (newOrder: Order) => {
      setOrders((prevOrders) => [...prevOrders, newOrder]);
    });

    // Escucha por pedidos que son actualizados (ej: marcados como listos)
    channel.bind('order-update', (updatedOrder: Order) => {
      setOrders((prevOrders) =>
        // Si el pedido fue marcado como 'READY', lo quitamos de la pantalla de la cocina.
        // Si no, simplemente actualizamos sus datos.
        updatedOrder.status === 'READY'
          ? prevOrders.filter((order) => order.id !== updatedOrder.id)
          : prevOrders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    });

    // 3. Limpia la conexión al salir de la página para evitar problemas
    return () => {
      pusher.unsubscribe('kitchen-channel');
      pusher.disconnect();
    };
  }, []);

  // --- Función para el Botón "Marcar como Listo" ---
  const handleMarkAsReady = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY' }),
      });
      // No necesitamos actualizar el estado aquí, Pusher lo hará por nosotros en tiempo real.
    } catch (error) {
      console.error("Error al marcar como listo:", error);
    }
  };

  // --- Estructura Visual (JSX) ---
  return (
    <main className="min-h-screen bg-gray-800 text-white p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center">Cocina</h1>
      </header>
      {isLoading ? (
        <p className="text-center">Cargando pedidos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="bg-white text-black rounded-lg p-4 flex flex-col">
                <h2 className="text-xl font-bold mb-2">Mesa: {order.table.name}</h2>
                <ul className="border-t border-b py-2 my-2 flex-grow">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.quantity}x</span>
                      <span className="flex-grow px-2">{item.product.name}</span>
                    </li>
                  ))}
                </ul>
                <button
                  // Conectamos el botón a nuestra nueva función
                  onClick={() => handleMarkAsReady(order.id)}
                  className="w-full bg-green-500 text-white p-2 rounded-md mt-2 font-bold hover:bg-green-600"
                >
                  Marcar como Listo
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 col-span-full text-center text-xl">
              No hay pedidos pendientes. ¡Buen trabajo! 🍳
            </p>
          )}
        </div>
      )}
    </main>
  );
}