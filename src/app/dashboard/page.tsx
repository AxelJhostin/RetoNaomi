// src/app/dashboard/page.tsx
'use client';

// --- CAMBIO: Añadimos useState, useEffect y useCallback ---
import { useState, useEffect, useCallback } from 'react'; 
import ProductManager from '@/components/dashboard/ProductManager';
import StaffManager from '@/components/dashboard/StaffManager';
import TableManager from '@/components/dashboard/TableManager';
import RoleManager  from '@/components/dashboard/RoleManager';
import CategoryManager from '@/components/dashboard/CategoryManager';
import ProductList from '@/components/dashboard/ProductList';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- Mantenemos la interfaz aquí, en el "gerente" ---
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { name: string } | null;
}

export default function DashboardPage() {
  const router = useRouter(); 

  // --- NUEVO: El estado de los productos ahora vive aquí ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // --- NUEVO: La función para buscar productos ahora vive aquí ---
  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []); // useCallback con array vacío para que la función no se recree

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- NUEVO: La función para borrar productos ahora vive aquí ---
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      fetchProducts(); // Llama a la función del "gerente" para refrescar
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    // ... tu función de logout se queda igual ...
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl mb-8 text-right">
        {/* ... tus botones de reporte y logout se quedan igual ... */}
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* --- Columna Izquierda --- */}
        <div className="flex flex-col gap-8">
          {/* --- CAMBIO: Pasamos las props a los componentes hijos --- */}
          <ProductManager onProductAdded={fetchProducts} />
          <ProductList 
            products={products}
            isLoading={isLoadingProducts}
            onDelete={handleDeleteProduct}
          />
        </div>

        {/* --- Columna Derecha --- */}
        <div className="flex flex-col gap-8">
          <CategoryManager />
          <RoleManager />
          <StaffManager />
          <TableManager />
        </div>
      </div>
    </main>
  );
}