// src/app/order/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Definición de Tipos
interface Product { id: string; name: string; price: number; }
interface OrderItem { id: string; quantity: number; product: Product; }
interface Order { id: string; table: { id: string; name: string }; items: OrderItem[]; total: number; }

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [menu, setMenu] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const handleSendToKitchen = async () => {
        try {
            await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'COOKING' }), // Cambiamos el estado
            });
            // Una vez enviado, redirigimos al mesero de vuelta a la vista de mesas
            router.push('/waiter');
        } catch (error) {
            console.error('Error al enviar a cocina:', error);
            alert('No se pudo enviar el pedido a cocina.');
        }
  };

  const handleRequestBill = async () => {
    if (!order) return;
    try {
      await fetch(`/api/tables/${order.table.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'BILLING' }),
      });
      router.push('/waiter');
    } catch (error) {
      console.error(error);
      alert('Error al solicitar la cuenta.');
    }
  };

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return;
    try {
      const [orderRes, menuRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch('/api/products') 
      ]);
      if (!orderRes.ok) throw new Error('Pedido no encontrado');

      const orderData = await orderRes.json();
      const menuData = await menuRes.json();

      setOrder(orderData);
      setMenu(menuData);
    } catch (error) {
      console.error(error);
      router.push('/waiter'); // Si hay error, vuelve a la vista de mesas
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleAddProductToOrder = async (productId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      // Recargamos los detalles para ver el nuevo producto
      fetchOrderDetails();
    } catch (error) {
      console.error("Error al añadir producto:", error);
    }
  };

  if (isLoading) return <p className="p-8">Cargando pedido...</p>;
  if (!order) return <p className="p-8">Pedido no encontrado.</p>;

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 h-screen">
      {/* Columna Izquierda: Menú de Productos */}
      <section className="bg-gray-50 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Añadir a Pedido</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map(product => (
            <button 
              key={product.id}
              onClick={() => handleAddProductToOrder(product.id)}
              className="p-4 border rounded-lg bg-white shadow hover:bg-blue-50"
            >
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Columna Derecha: Detalles del Pedido */}
      <section className="p-6 bg-white flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Pedido: <span className="text-blue-600">{order.table.name}</span></h1>
          <button onClick={() => router.push('/waiter')} className="text-sm text-blue-600">Volver a Mesas</button>
        </div>
        <div className="flex-grow border-t pt-4 overflow-y-auto">
          {order.items.length === 0 ? (
            <p>Este pedido está vacío.</p>
          ) : (
            <ul>
              {order.items.map(item => (
                <li key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.quantity * item.product.price).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button onClick={handleSendToKitchen} className="w-full bg-green-500 ...">
              Enviar a Cocina
            </button>
            <button onClick={handleRequestBill} className="w-full bg-yellow-500 ...">
              Pedir Cuenta
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}