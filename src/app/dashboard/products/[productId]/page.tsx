// src/app/dashboard/products/[productId]/page.tsx
'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ModifierGroupCard from '@/components/modifiers/ModifierGroupCard';
import ProductEditForm from '@/components/products/ProductEditForm';

// Definimos una interfaz más completa para el producto
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

interface ProductWithDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  modifierGroups: ModifierGroup[];
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  
  const params = useParams();
  const productId = params.productId as string;

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Producto no encontrado');
      }
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return; // Evita nombres vacíos

    try {
      // Aquí deberíamos tener una API específica para modificadores
      // Por ahora, supondremos que la crearemos en el siguiente paso
      const res = await fetch(`/api/modifier-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, productId: productId }),
      });

      if (!res.ok) {
        throw new Error('No se pudo crear el grupo');
      }

      setNewGroupName('');
      fetchProductDetails(); // Recargamos para ver el nuevo grupo
    } catch (error) {
      console.error('Error al crear grupo:', error);
      // Aquí podrías mostrar un error al usuario
    }
  };

  if (isLoading) return <p className="p-8 text-center">Cargando detalles del producto...</p>;
  if (error) return <p className="p-8 text-center text-red-500">Error: {error}</p>;
  if (!product) return <p className="p-8 text-center">Producto no encontrado.</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 block">
          &larr; Volver al Dashboard
        </Link>
        
        {/* FORMULARIO PARA EDITAR EL PRODUCTO */}
        <ProductEditForm product={product} onProductUpdate={fetchProductDetails} />

        {/* TARJETA PARA GESTIONAR MODIFICADORES */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Grupos de Modificadores</h2>
          
          <div className="space-y-4 mb-6">
            {product.modifierGroups.length > 0 ? (
              product.modifierGroups.map(group => (
                <ModifierGroupCard 
                  key={group.id} 
                  group={group} 
                  onUpdate={fetchProductDetails} 
                />
              ))
            ) : (
              <p className="text-gray-500 italic">Este producto aún no tiene grupos de modificadores.</p>
            )}
          </div>

          <form onSubmit={handleAddGroup} className="flex flex-col sm:flex-row gap-4 border-t pt-6">
            <input
              type="text"
              placeholder="Nombre del grupo (ej: Elige tu salsa)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-grow rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shrink-0">
              Añadir Grupo
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}
// src/components/products/ProductEditForm.tsx