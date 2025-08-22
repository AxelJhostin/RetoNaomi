// src/app/kitchen/page.tsx
'use client';
import { useState, useEffect } from 'react';

// (Puedes copiar las interfaces de Order, OrderItem, etc. o importarlas desde un archivo compartido)
interface OrderItem { id: string; quantity: number; product: { name: string }; }
interface Order { id:string; table: { name: string }; items: OrderItem[]; }

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return (
    <main className="min-h-screen bg-gray-800 text-white p-4">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-center">Cocina</h1>
      </header>
      {isLoading ? (
        <p className="text-center">Cargando pedidos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map(order => (
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
              <button className="w-full bg-green-500 text-white p-2 rounded-md mt-2 font-bold">
                Marcar como Listo
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}