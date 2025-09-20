'use client';
import Link from 'next/link';

// Las interfaces se mueven a la página principal
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { name: string } | null;
}

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (productId: string) => void;
}

export default function ProductList({ products, isLoading, onDelete }: ProductListProps) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Mi Menú</h2>
      {isLoading ? (<p>Cargando...</p>) : products.length > 0 ? (
        <ul>
          {products.map((product) => (
            <li key={product.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b py-4 last:border-none">
              <div className="mb-2 sm:mb-0">
                <p className="font-semibold text-gray-800">{product.name}</p>
                <p className="text-sm text-gray-500">{product.description}</p>
              </div>
              <div className="flex w-full sm:w-auto items-center justify-between shrink-0">
                <p className="font-mono text-lg font-semibold text-blue-600">${product.price.toFixed(2)}</p>
                <div className="flex gap-2 ml-4">
                  <Link href={`/dashboard/products/${product.id}`}>
                    <button className="rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">Editar</button>
                  </Link>
                  <button onClick={() => onDelete(product.id)} className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">Eliminar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (<p>No hay productos para mostrar.</p>)}
    </div>
  );
}