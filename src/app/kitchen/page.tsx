// src/app/kitchen/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- Importamos useRouter
import Pusher from 'pusher-js';

// Interfaces para los datos que recibiremos
interface OrderItem {
  id: string;
  quantity: number;
  product: { name: string };
  selectedModifiers?: { id: string; name: string; price: number }[];
}
interface Order {
  id: string;
  table: { name: string };
  items: OrderItem[];
  status: string;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter(); // <-- Inicializamos el router

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('kitchen-channel');
    channel.bind('new-order', (newOrder: Order) => {
      setOrders(prevOrders => [...prevOrders, newOrder]);
    });
    
    return () => {
      pusher.unsubscribe('kitchen-channel');
    };
  }, []);

  // --- FUNCIÓN PARA CERRAR SESIÓN ---
  const handleLogout = async () => {
    try {
      await fetch('/api/staff/logout', { method: 'POST' });
      router.push('/staff-login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleMarkAsReady = async (orderId: string) => {
    // Aquí actualizaremos el estado de la orden a 'READY'
    try {
        await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'READY' }),
        });
        // Removemos la orden de la pantalla de cocina
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    } catch (error) {
        console.error('Error al marcar como listo:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-800 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Cocina</h1>
        {/* --- BOTÓN DE LOGOUT AÑADIDO --- */}
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-700"
        >
          Cerrar Sesión
        </button>
      </div>
      
      {orders.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">No hay pedidos pendientes.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map(order => (
            <div key={order.id} className="bg-gray-700 rounded-lg p-6 shadow-lg flex flex-col">
              <h2 className="text-2xl font-bold mb-4">Mesa: {order.table.name}</h2>
              <ul className="flex-grow space-y-3 border-t border-b border-gray-600 py-4">
                {order.items.map(item => (
                  <li key={item.id}>
                    <span className="font-semibold text-lg">{item.quantity}x {item.product.name}</span>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <ul className="text-sm text-gray-300 pl-6 list-disc list-inside">
                        {item.selectedModifiers.map(mod => (
                          <li key={mod.id}>{mod.name}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleMarkAsReady(order.id)}
                className="mt-6 w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700"
              >
                Marcar como Listo
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}