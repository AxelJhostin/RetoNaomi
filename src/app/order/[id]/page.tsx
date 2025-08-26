//src/app/order/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ModifierModal from '@/components/order/ModifierModal';

// --- Definición de Tipos ---
interface ModifierOption {
  id: string;
  name: string;
  price: number;
}
interface ModifierGroup {
  id: string;
  name: string;
  options: ModifierOption[];
}
interface Product { id: string; name: string; price: number;modifierGroups: ModifierGroup[]; }
interface OrderItem { 
  id: string; 
  quantity: number; 
  price: number; // El precio base del producto
  product: { id: string, name: string };
  selectedModifiers?: { id: string, name: string, price: number }[]; // Los modificadores que se eligieron
}
interface Order { 
  id: string; 
  table: { id: string; name: string }; 
  items: OrderItem[]; 
  total: number;
  status: string;
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [menu, setMenu] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  // --- Estados para controlar el Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
      router.push('/waiter');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // --- Lógica para manejar el clic en un producto ---
  const handleProductClick = (product: Product) => {
    // Si el producto TIENE modificadores, abrimos el modal
    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setSelectedProduct(product);
      setIsModalOpen(true);
    } else {
      // Si NO tiene, lo añadimos directamente como antes
      handleAddProductToOrder(product.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };
  
  const handleAddToCartWithModifiers = async (
  product: Product, 
  selectedOptions: ModifierOption[]
) => {
  try {
    const res = await fetch(`/api/orders/${orderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        options: selectedOptions, // <-- ¡Aquí enviamos las opciones a la API!
      }),
    });

    if (!res.ok) {
      throw new Error('Error al añadir el item con modificadores');
    }

    // Si todo fue bien, refrescamos los detalles del pedido y cerramos el modal
    fetchOrderDetails();
    handleCloseModal();

  } catch (error) {
    console.error("Error adding item with modifiers:", error);
    alert('No se pudo añadir el producto al pedido.');
  }
};

  const handleAddProductToOrder = async (productId: string) => {
    try {
      await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      fetchOrderDetails();
    } catch (error) {
      console.error("Error al añadir producto:", error);
    }
  };

  const updateOrderStatus = async (status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (status === 'COOKING') {
        router.push('/waiter');
      } else {
        fetchOrderDetails();
      }
    } catch (error) {
      console.error(`Error al cambiar estado a ${status}:`, error);
      alert(`No se pudo actualizar el pedido.`);
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
  
  const updateOrderItemQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await fetch(`/api/orders/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      fetchOrderDetails();
    } catch (error) {
      console.error("Error al actualizar cantidad:", error);
    }
  };

  const deleteOrderItem = async (itemId: string) => {
    try {
      await fetch(`/api/orders/items/${itemId}`, {
        method: 'DELETE',
      });
      fetchOrderDetails();
    } catch (error) {
      console.error("Error al eliminar item:", error);
    }
  };

  const calculateItemTotal = (item: OrderItem) => {
    const modifiersPrice = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
    return (item.price + modifiersPrice) * item.quantity;
  };

  if (isLoading) return <p className="p-8">Cargando pedido...</p>;
  if (!order) return <p className="p-8">Pedido no encontrado.</p>;

  return (
     <>
    <main className="grid grid-cols-1 md:grid-cols-2 h-screen">
      <section className="bg-gray-50 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Añadir a Pedido</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {menu.map(product => (
              <button 
                key={product.id}
                // --- El cambio clave está aquí ---
                onClick={() => handleProductClick(product)}
                className="p-4 border rounded-lg bg-white shadow hover:bg-blue-50 disabled:opacity-50"
                disabled={order.status !== 'OPEN'}
              >
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
      </section>

      <section className="p-6 bg-white flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Pedido: <span className="text-blue-600">{order.table.name}</span></h1>
          <button onClick={() => router.push('/waiter')} className="text-sm text-blue-600">Volver a Mesas</button>
        </div>
        <div className="flex-grow border-t pt-4 overflow-y-auto">
          {order.items.length === 0 ? (<p>Este pedido está vacío.</p>) : (
            <ul>
              {order.items.map(item => (
                <li key={item.id} className="flex justify-between items-start py-3 border-b last:border-none">
                    <div className="flex items-start gap-4">
                      <button onClick={() => deleteOrderItem(item.id)} className="text-red-500 font-bold text-lg hover:text-red-700 mt-1 disabled:opacity-50" disabled={order.status !== 'OPEN'}>&times;</button>
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <ul className="text-xs text-gray-500 pl-3">
                            {item.selectedModifiers.map((mod) => (
                              <li key={mod.id}>+ {mod.name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="font-semibold font-mono">${calculateItemTotal(item).toFixed(2)}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>Cant:</span>
                        <button onClick={() => updateOrderItemQuantity(item.id, item.quantity - 1)} className="h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50" disabled={order.status !== 'OPEN' || item.quantity <= 1}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateOrderItemQuantity(item.id, item.quantity + 1)} className="h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50" disabled={order.status !== 'OPEN'}>+</button>
                      </div>
                    </div>
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
          <div className="grid grid-cols-1 gap-4 mt-4">
            {order.status === 'OPEN' && (<button onClick={() => updateOrderStatus('COOKING')} className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600">Enviar a Cocina</button>)}
            {order.status === 'COOKING' && (<div className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg font-bold text-center">En preparación... 🍳</div>)}
            {order.status === 'READY' && (<button onClick={() => updateOrderStatus('DELIVERED')} className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600">Marcar como Entregado</button>)}
            {order.status === 'DELIVERED' && (<button onClick={handleRequestBill} className="w-full bg-yellow-500 text-white p-3 rounded-lg font-bold hover:bg-yellow-600">Pedir Cuenta</button>)}
          </div>
        </div>
      </section>
    </main>
    {selectedProduct && (
        <ModifierModal
          isOpen={isModalOpen}
          product={selectedProduct}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCartWithModifiers}
        />
      )}
      </>
  );
}