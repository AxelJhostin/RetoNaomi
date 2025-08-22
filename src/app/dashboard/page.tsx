// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';

// Definimos cómo se ve un objeto Producto para que TypeScript nos ayude
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
}

export default function DashboardPage() {
  // Estados para guardar los productos y saber si están cargando
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect se ejecuta una vez cuando el componente se carga
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Le pedimos los productos a nuestra API
        const response = await fetch('/api/products');
        const data = await response.json();
        setProducts(data); // Guardamos los productos en el estado
      } catch (error) {
        console.error('Error al cargar los productos:', error);
      } finally {
        setIsLoading(false); // Dejamos de cargar, ya sea con éxito o error
      }
    };

    fetchProducts();
  }, []); // El array vacío [] asegura que solo se ejecute una vez

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Gestión de Productos</h1>

        {/* Aquí mostraremos los productos */}
        <div className="rounded-lg bg-white p-6 shadow-md">
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
            <p className="text-center text-gray-500">No hay productos para mostrar. ¡Añade el primero!</p>
          )}
        </div>
      </div>
    </main>
  );
}