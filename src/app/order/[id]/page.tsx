//src/app/order/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ModifierModal from '@/components/order/ModifierModal';
import { OrderWithRelations, ProductWithRelations, OrderItemWithRelations, ModifierOption } from '@/types';

interface Split {
  id: number;
  items: OrderItemWithRelations[];
}

export default function OrderDetailPage() {
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [menu, setMenu] = useState<ProductWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  //vamos a poner los nuevos estados para la divicion de cuenta
  const [isSplitting, setIsSplitting] = useState(false);
  const [splits, setSplits] = useState<Split[]>([]);

   const [unassignedItems, setUnassignedItems] = useState<OrderItemWithRelations[]>([]);
  // Guarda el ítem que el mesero ha seleccionado para mover
  const [itemToMove, setItemToMove] = useState<OrderItemWithRelations | null>(null);


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

  const handleGoBack = async () => {
    if (order && order.items.length === 0) {
      await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
    }
    router.push('/waiter');
  };

  const handleProductClick = (product: ProductWithRelations) => {
  // Siempre abrimos el modal, sin importar si tiene modificadores o no.
  setSelectedProduct(product);
  setIsModalOpen(true);
};

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };
  
  const handleAddToCartWithModifiers = async (
    product: ProductWithRelations, 
    selectedOptions: ModifierOption[],
    notes: string // <-- Acepta el nuevo parámetro 'notes'
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          options: selectedOptions,
          notes: notes, // <-- Y lo envía a la API
        }),
      });

      if (!res.ok) {
        throw new Error('Error al añadir el item');
      }
      fetchOrderDetails();
      handleCloseModal();
    } catch (error) {
      console.error("Error adding item:", error);
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
      fetchOrderDetails(); 
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

  const calculateItemTotal = (item: OrderItemWithRelations) => {
    const modifiersPrice = item.selectedModifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0;
    const basePrice = item.price; 
    return (basePrice + modifiersPrice) * item.quantity;
  };

  const handleStartSplitting = () => {
    if (!order) return;
    setIsSplitting(true);
    // Ahora, todos los ítems empiezan en la columna "sin asignar"
    setUnassignedItems([...order.items]);
    // Empezamos con una sola columna de pago vacía
    setSplits([{ id: 1, items: [] }]);
    setItemToMove(null); // Reseteamos por si acaso
  };

  const handleAssignItem = (targetSplitId: number) => {
    // Si no hay ningún ítem seleccionado para mover, no hacemos nada
    if (!itemToMove) return;

    // Movemos el ítem desde "unassignedItems" a la columna de pago correcta
    setUnassignedItems(prev => prev.filter(item => item.id !== itemToMove.id));
    setSplits(prevSplits => prevSplits.map(split => 
      split.id === targetSplitId 
        ? { ...split, items: [...split.items, itemToMove] }
        : split
    ));

    // Limpiamos la selección para que se pueda mover otro ítem
    setItemToMove(null);
  };

  const handleAddSplit = () => {
    // Añade una nueva persona/columna vacía
    const newSplitId = splits.length > 0 ? Math.max(...splits.map(s => s.id)) + 1 : 1;
    setSplits(prev => [...prev, { id: newSplitId, items: [] }]);
  };

  const handleCancelSplitting = () => {
    setIsSplitting(false);
    setSplits([]);
  };

  // Función para calcular el total de una sub-cuenta
  const calculateSplitTotal = (splitItems: OrderItemWithRelations[]) => {
    return splitItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleSplitItem = (itemToSplit: OrderItemWithRelations) => {
    // Pedimos al usuario el número de divisiones
    const numSplits = parseInt(prompt('¿Dividir este ítem entre cuántas personas?', '2') || '1', 10);
    
    // Validamos la entrada
    if (isNaN(numSplits) || numSplits <= 1 || numSplits > itemToSplit.quantity) {
      alert('Número inválido. Debe ser un número mayor a 1 y no mayor a la cantidad del producto.');
      return;
    }

    // Calculamos el precio y cantidad para cada parte
    const originalTotal = calculateItemTotal(itemToSplit);
    const splitPrice = originalTotal / numSplits;
    const splitQuantity = itemToSplit.quantity / numSplits;

    // Creamos los nuevos "sub-ítems"
    const newSplitItems: OrderItemWithRelations[] = Array.from({ length: numSplits }).map((_, index) => ({
      ...itemToSplit,
      // Creamos un ID único para cada sub-item para que React no se confunda
      id: `${itemToSplit.id}-split-${index}`,
      price: itemToSplit.price / numSplits, // Dividimos el precio base
      quantity: splitQuantity,
      product: {
        ...itemToSplit.product, // <-- 1. Copiamos todas las propiedades del producto original
        // 2. Y LUEGO modificamos solo el nombre
        name: `${itemToSplit.product.name} (1/${numSplits})`,
      }
    }));

    // Actualizamos el estado: removemos el ítem original y añadimos los nuevos sub-ítems
    setUnassignedItems(prev => [
      ...prev.filter(item => item.id !== itemToSplit.id),
      ...newSplitItems,
    ]);
  };

  const handleProcessSplitPayment = async (split: Split) => {
    if (!order || split.items.length === 0) return;

    // Podríamos añadir un estado de 'cargando' aquí para deshabilitar el botón
    
    try {
        // Mapeamos los items de la división al formato que espera la API
        const itemsPayload = split.items.map(item => ({
            quantity: item.quantity,
            productName: item.product.name,
            unitPrice: item.price,
            modifiers: ((item.selectedModifiers as ModifierOption[]) || []).map(mod => mod.name),
            itemTotal: calculateItemTotal(item),
            notes: item.notes,
        }));

        // Llamamos a nuestra nueva API para crear la factura parcial
        const res = await fetch('/api/invoices/from-split', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: order.id,
                items: itemsPayload,
            }),
        });

        if (!res.ok) throw new Error('No se pudo procesar el pago');

        const newInvoice = await res.json();
        
        // Llevamos al mesero a la página del recibo recién generado
        router.push(`/invoice/${newInvoice.id}`);

    } catch (error) {
        console.error(error);
        alert('Error al procesar el pago.');
    }
  };

  if (isLoading) return <p className="p-8">Cargando pedido...</p>;
  if (!order) return <p className="p-8">Pedido no encontrado.</p>;

  const filteredMenu = menu.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedMenu = filteredMenu.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin Categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, ProductWithRelations[]>);

return (
    <>
      <main className="grid grid-cols-1 md:grid-cols-2 h-screen">
        <section className="bg-gray-50 p-6 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">Añadir a Pedido</h1>
          <div className="mb-4 sticky top-0 bg-gray-50 py-2">
            <input 
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div className="space-y-6">
            {Object.keys(groupedMenu).length === 0 && !isLoading ? (
                <p className="text-gray-500">No se encontraron productos.</p>
            ) : (
              Object.entries(groupedMenu).map(([categoryName, products]) => (
                <div key={categoryName}>
                  <h2 className="text-lg font-semibold text-gray-800 border-b-2 border-gray-200 pb-2 mb-3">
                    {categoryName}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="p-4 border rounded-lg bg-white shadow hover:bg-blue-50 disabled:opacity-50 h-24 flex flex-col justify-center text-center"
                        disabled={order.status !== 'OPEN'}
                      >
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-gray-600 mt-1">${product.price.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="p-6 bg-white flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Pedido: <span className="text-blue-600">{order.table.name}</span></h1>
            <button onClick={isSplitting ? handleCancelSplitting : handleGoBack} className="text-sm text-blue-600 hover:underline">
              {isSplitting ? 'Cancelar División' : 'Volver a Mesas'}
            </button>
          </div>
          
          {!isSplitting ? (
            <>
              <div className="flex-grow border-t pt-4 overflow-y-auto">
                {order.items.length === 0 ? (<p>Este pedido está vacío.</p>) : (
                  <ul>
                    {order.items.map(item => (
                      <li key={item.id} className="flex justify-between items-start py-3 border-b last:border-none">
                        <div className="flex items-start gap-4">
                          <button onClick={() => deleteOrderItem(item.id)} className="text-red-500 font-bold text-lg hover:text-red-700 mt-1 disabled:opacity-50" disabled={order.status !== 'OPEN'}>&times;</button>
                            <div>
                              <p className="font-semibold">{item.product.name}</p>
                              {item.selectedModifiers && (item.selectedModifiers as ModifierOption[]).length > 0 && (
                                  <ul className="text-xs text-gray-500 pl-3">
                                      {(item.selectedModifiers as ModifierOption[]).map((mod) => (
                                          <li key={mod.id}>+ {mod.name}</li>
                                      ))}
                                  </ul>
                              )}
                              {item.notes && (
                                  <p className="text-xs text-orange-600 italic pl-3 mt-1">
                                      Nota: {item.notes}
                                  </p>
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
                  {order.status === 'COOKING' && (<button onClick={() => updateOrderStatus('OPEN')} className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600">Añadir más / Modificar</button>)}
                  {order.status === 'READY' && (<button onClick={() => updateOrderStatus('DELIVERED')} className="w-full bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600">Marcar como Entregado</button>)}
                  
                  {(order.status === 'READY' || order.status === 'DELIVERED') && (
                    <div className='flex gap-4'>
                      <button onClick={handleRequestBill} className="w-full bg-yellow-500 text-white p-3 rounded-lg font-bold hover:bg-yellow-600">Pedir Cuenta</button>
                      <button onClick={handleStartSplitting} className="w-full bg-purple-600 text-white p-3 rounded-lg font-bold hover:bg-purple-700">Dividir Cuenta</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex-grow border-t pt-4 flex flex-col">
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-2 text-gray-700">Productos sin Asignar</h3>
                  <div className="space-y-2 p-2 border rounded-lg bg-gray-50 min-h-[100px]">
                    {unassignedItems.map(item => (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-md transition-all ${
                          itemToMove?.id === item.id ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <div 
                          onClick={() => setItemToMove(item)}
                          className="flex-grow cursor-pointer"
                        >
                          <span>{item.quantity}x {item.product.name}</span>
                          <span className='font-mono float-right'>${calculateItemTotal(item).toFixed(2)}</span>
                        </div>
                        {!item.id.includes('-split-') && item.quantity === 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSplitItem(item);
                            }}
                            className="ml-2 px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                            title="Dividir este ítem"
                          >
                            ✂️
                          </button>
                        )}
                      </div>
                    ))}
                    {unassignedItems.length === 0 && <p className="text-xs text-gray-400 text-center p-4">Todos los productos han sido asignados.</p>}
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <button onClick={handleAddSplit} className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-green-600">
                      + Añadir Persona
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {splits.map(split => (
                      <div 
                        key={split.id}
                        onClick={() => handleAssignItem(split.id)}
                        className="border rounded-lg p-4 bg-gray-50 flex flex-col min-h-[200px] cursor-pointer hover:border-blue-500 transition-all"
                      >
                        <h3 className="font-bold text-lg mb-2 border-b pb-2">Pago {split.id}</h3>
                        <ul className='flex-grow space-y-2'>
                          {split.items.map(item => (
                            <li key={item.id} className="text-sm flex justify-between p-2 rounded-md bg-white shadow-sm">
                              <div>
                                  <span className='font-semibold'>{item.quantity}x {item.product.name}</span>
                                  {item.notes && <p className='text-xs text-gray-500 italic'>({item.notes})</p>}
                              </div>
                              <span className='font-mono'>${calculateItemTotal(item).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t mt-4 pt-2 text-right">
                          <span className="font-bold">Total: ${calculateSplitTotal(split.items).toFixed(2)}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Evita que se active el onClick del div padre
                              handleProcessSplitPayment(split);
                            }}
                            className='w-full bg-blue-600 text-white p-2 rounded-md text-sm font-bold mt-4 hover:bg-blue-700 disabled:bg-gray-400'
                            // Deshabilitamos el botón si la sub-cuenta está vacía
                            disabled={split.items.length === 0}
                          >
                            Cobrar Pago {split.id}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
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