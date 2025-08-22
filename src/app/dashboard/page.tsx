// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el nuevo formulario de producto
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Función para obtener los productos
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Función para manejar el envío del nuevo producto
  const handleAddProduct = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          price: parseFloat(newPrice),
          description: newDescription,
          category: newCategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el producto');
      }

      // Limpiamos el formulario y recargamos la lista de productos
      setNewName('');
      setNewPrice('');
      setNewDescription('');
      setNewCategory('');
      fetchProducts(); // Vuelve a pedir la lista actualizada de productos

    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Gestión de Productos</h1>

        {/* Formulario para añadir nuevo producto */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Añadir Nuevo Producto</h2>
          <form onSubmit={handleAddProduct}>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />
              <input
                type="number"
                placeholder="Precio (ej: 8.50)"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                step="0.01"
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Categoría (ej: Bebidas, Postres)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
              />
            </div>
            <div className="mb-4">
              <textarea
                placeholder="Descripción del producto"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2"
                rows={3}
              ></textarea>
            </div>
            <button type="submit" className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700">
              Añadir Producto
            </button>
          </form>
        </div>

        {/* Lista de productos existentes */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Mi Menú</h2>
          {isLoading ? (
            <p>Cargando productos...</p>
          ) : products.length > 0 ? (
            <ul>
              {products.map((product) => (
                <li key={product.id} className="flex items-center justify-between border-b py-4 last:border-none">
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.description}</p>
                  </div>
                  <p className="font-mono text-lg font-semibold text-blue-600">${product.price.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">No hay productos para mostrar.</p>
          )}
        </div>
      </div>
    </main>
  );
}