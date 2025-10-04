// src/app/manager/products/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProductManager from '@/components/dashboard/ProductManager';
import ProductList from '@/components/dashboard/ProductList';

// Definimos un tipo local para los productos
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { name: string } | null;
}

export default function ManageProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener la lista de productos
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // La API ya está preparada para aceptar al gerente
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Función para manejar la eliminación de un producto
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      // La API ya está preparada para aceptar al gerente
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      fetchProducts(); // Recargamos la lista de productos
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Productos</h1>
        <Link href="/manager" className="text-blue-600 hover:underline">
          &larr; Volver al Panel de Gerente
        </Link>
      </header>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Reutilizamos el componente para AÑADIR productos */}
        <ProductManager onProductAdded={fetchProducts} />

        {/* Reutilizamos el componente para LISTAR y ELIMINAR productos */}
        <ProductList 
          products={products}
          isLoading={isLoading}
          onDelete={handleDeleteProduct}
        />
      </div>
    </main>
  );
}