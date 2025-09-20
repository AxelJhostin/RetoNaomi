// src/components/dashboard/ProductManager.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';

interface Category {
  id: string;
  name: string;
}

// --- AÑADIMOS LA INTERFAZ PARA LAS PROPS ---
interface ProductManagerProps {
  onProductAdded: () => void;
}

// --- ACTUALIZAMOS LA FIRMA DE LA FUNCIÓN ---
export default function ProductManager({ onProductAdded }: ProductManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setNewCategoryId(data[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          price: parseFloat(newPrice), 
          description: newDescription, 
          categoryId: newCategoryId,
        }),
      });

      if (!res.ok) throw new Error('No se pudo crear el producto');

      setNewName(''); 
      setNewPrice(''); 
      setNewDescription('');
      onProductAdded(); // Ahora esta línea es válida
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Añadir Nuevo Producto</h2>
      <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="text" placeholder="Nombre del producto" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
          <input type="number" placeholder="Precio (ej: 8.50)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" step="0.01" required />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select id="category" value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required>
            <option value="" disabled>Selecciona una categoría</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <textarea placeholder="Descripción del producto" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" rows={3}></textarea>
        <button type="submit" className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700">Añadir Producto</button>
      </form>
    </div>
  );
}