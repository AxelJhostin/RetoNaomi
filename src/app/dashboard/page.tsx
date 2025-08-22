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

  //Estados para la edición de productos
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedCategory, setEditedCategory] = useState('');

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

  const handleDelete = async (productId: string) => {
  // Pedimos confirmación antes de borrar
  if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el producto');
    }

    // Actualizamos la lista de productos en la UI sin recargar la página
    setProducts(products.filter((p) => p.id !== productId));

  } catch (error) {
    console.error('Error:', error);
  }
};

const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditedName(product.name);
    setEditedPrice(product.price.toString());
    setEditedDescription(product.description || '');
    setEditedCategory(product.category || '');
  };

const handleUpdateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          price: parseFloat(editedPrice),
          description: editedDescription,
          category: editedCategory,
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar el producto');

      setEditingProduct(null); // Cierra el modal
      fetchProducts(); // Recarga la lista de productos
    } catch (error) {
      console.error("Error:", error);
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
                <li key={product.id} className="flex flex-col items-start justify-between border-b py-4 last:border-none sm:flex-row sm:items-center">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.description}</p>
                  </div>
                  <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end">
                    <p className="font-mono text-lg font-semibold text-blue-600">${product.price.toFixed(2)}</p>
                    {/* --- ¡NUEVO BOTÓN DE EDITAR! --- */}
                    <button onClick={() => handleEditClick(product)} className="ml-4 rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="ml-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500">No hay productos para mostrar.</p>
          )}
        </div>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Editar Producto</h2>
            <form onSubmit={handleUpdateSubmit}>
              {/* ... (Campos del formulario de edición, similar al de añadir) ... */}
              <div className="mb-4">
                <label>Nombre</label>
                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div className="mb-4">
                <label>Precio</label>
                <input type="number" value={editedPrice} onChange={(e) => setEditedPrice(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" step="0.01" required />
              </div>
              <div className="mb-4">
                <label>Descripción</label>
                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" rows={3}></textarea>
              </div>
               <div className="mb-4">
                <label>Categoría</label>
                <input type="text" value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}