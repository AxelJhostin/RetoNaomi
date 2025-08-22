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

interface Role {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
  role: Role;
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Estados para el nuevo formulario de producto
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');

  //Estados para la edición de productos
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedCategory, setEditedCategory] = useState('');

  // --- ¡NUEVOS ESTADOS PARA PERSONAL! ---
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  // ---

  // --- LÓGICA PARA OBTENER DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      // Obtener Productos
      try {
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        setProducts(productsData);
      } catch (error) { console.error('Error al cargar los productos:', error); }
      setIsLoadingProducts(false);

      // Obtener Roles y Personal
      try {
        const rolesRes = await fetch('/api/roles');
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
        if (rolesData.length > 0) setSelectedRoleId(rolesData[0].id); // Selecciona el primer rol por defecto

        const staffRes = await fetch('/api/staff');
        const staffData = await staffRes.json();
        setStaff(staffData);
      } catch (error) { console.error('Error al cargar personal y roles:', error); }
      setIsLoadingStaff(false);
    };

    fetchData();
  }, []);

  // Función para obtener los productos
  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error al cargar los productos:', error);
    } finally {
      setIsLoadingProducts(false);
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
          name: newProductName,
          price: parseFloat(newPrice),
          description: newDescription,
          category: newCategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear el producto');
      }

      // Limpiamos el formulario y recargamos la lista de productos
      setNewProductName('');
      setNewPrice('');
      setNewDescription('');
      setNewCategory('');
      fetchProducts(); // Vuelve a pedir la lista actualizada de productos

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddStaff = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          pin: newStaffPin,
          roleId: selectedRoleId,
        }),
      });
      if (!response.ok) throw new Error('Error al crear el empleado');

      // Limpiamos el formulario y recargamos la lista
      setNewStaffName('');
      setNewStaffPin('');
      // Para recargar la lista, podríamos llamar a una función fetchStaff() o simplemente añadir el nuevo miembro a la lista existente
      const newMember = await response.json();
      setStaff([...staff, newMember]);

    } catch (error) { console.error('Error:', error); }
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
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Columna de Gestión de Productos */}
        <section>
          <h1 className="mb-6 text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          {/* ... (Todo el JSX de productos va aquí, sin cambios) ... */}
        </section>
        
        {/* --- ¡NUEVA COLUMNA DE GESTIÓN DE PERSONAL! --- */}
        <section>
          <h1 className="mb-6 text-3xl font-bold text-gray-900">Gestión de Personal</h1>

          {/* Formulario para añadir nuevo personal */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Añadir Empleado</h2>
            <form onSubmit={handleAddStaff}>
              <div className="mb-4">
                <input type="text" placeholder="Nombre del empleado" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="text" placeholder="PIN de 4 dígitos" value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
                <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700">Añadir Empleado</button>
            </form>
          </div>

          {/* Lista de personal existente */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Mi Personal</h2>
            {isLoadingStaff ? ( <p>Cargando personal...</p> ) 
            : staff.length > 0 ? (
              <ul>
                {staff.map((member) => (
                  <li key={member.id} className="flex items-center justify-between border-b py-3 last:border-none">
                    <p className="font-semibold text-gray-800">{member.name}</p>
                    <p className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700">{member.role.name}</p>
                  </li>
                ))}
              </ul>
            ) : ( <p className="text-center text-gray-500">No has añadido personal.</p> )}
          </div>
        </section>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Gestión de Productos</h1>

        {/* Formulario para añadir nuevo producto */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Añadir Nuevo Producto</h2>
          <form onSubmit={handleAddProduct}>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
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
          {isLoadingProducts ? (
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