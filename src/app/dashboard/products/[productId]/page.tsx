// src/app/dashboard/products/[productId]/page.tsx
'use client';
import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Definimos los tipos para nuestros datos
interface ModifierOption { id: string; name: string; price: number; }
interface ModifierGroup { id: string; name: string; options: ModifierOption[]; }
interface Product { id: string; name: string; modifierGroups: ModifierGroup[]; }

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const params = useParams();
  const productId = params.productId as string;

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/products/${productId}/modifier-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      setNewGroupName('');
      fetchProductDetails(); // Recargamos para ver el nuevo grupo
    } catch (error) {
      console.error('Error al crear grupo:', error);
    }
  };

  if (isLoading) return <p className="p-8">Cargando producto...</p>;
  if (!product) return <p className="p-8">Producto no encontrado.</p>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 block">&larr; Volver al Dashboard</Link>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-2 text-lg text-gray-600">Gestiona las opciones y modificadores para este producto.</p>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">Grupos de Modificadores</h2>
          {/* Aquí mostraremos los grupos existentes */}
          <div className="space-y-4 mb-6">
            {product.modifierGroups.map(group => (
              <div key={group.id} className="border p-4 rounded-md">
                <p className="font-bold">{group.name}</p>
                {/* Más adelante aquí pondremos las opciones */}
              </div>
            ))}
          </div>

          {/* Formulario para añadir un nuevo grupo */}
          <form onSubmit={handleAddGroup} className="flex gap-4">
            <input
              type="text"
              placeholder="Nombre del nuevo grupo (ej: Elige tu salsa)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-grow rounded-md border border-gray-300 p-2"
              required
            />
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Añadir Grupo</button>
          </form>
        </div>
      </div>
    </main>
  );
}