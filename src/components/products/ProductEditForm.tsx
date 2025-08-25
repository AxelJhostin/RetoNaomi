// src/components/products/ProductEditForm.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';

// --- SECCIÓN CORREGIDA ---
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
// -------------------------

interface ProductEditFormProps {
  product: ProductWithDetails;
  onProductUpdate: () => void; // Función para refrescar los datos
}

export default function ProductEditForm({ product, onProductUpdate }: ProductEditFormProps) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(product.price.toString());
  const [category, setCategory] = useState(product.category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Sincroniza el estado si el producto que llega como prop cambia
  useEffect(() => {
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price.toString());
    setCategory(product.category || '');
  }, [product]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          category,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el producto');
      }

      setMessage('¡Producto actualizado con éxito!');
      onProductUpdate(); 

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Error al actualizar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Editar Detalles del Producto</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" step="0.01" required />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
          <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={3}></textarea>
        </div>
        <div className="flex items-center justify-end gap-4">
          {message && <p className="text-sm text-gray-600">{message}</p>}
          <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400">
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}