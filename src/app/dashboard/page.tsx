// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';

// --- Definición de Tipos ---
interface Product { id: string; name: string; description: string | null; price: number; category: string | null; }
interface Role { id: string; name: string; }
interface Staff { id: string; name: string; pin: string; role: Role; roleId: string; }

// --- Componente Principal del Dashboard ---
export default function DashboardPage() {
  // --- Estados para Productos ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [newProductName, setNewProductName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedCategory, setEditedCategory] = useState('');

  // --- Estados para Personal ---
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editedStaffName, setEditedStaffName] = useState('');
  const [editedStaffPin, setEditedStaffPin] = useState('');
  const [editedStaffRoleId, setEditedStaffRoleId] = useState('');

  // --- Función centralizada para obtener TODOS los datos ---
  const fetchData = useCallback(async () => {
    setIsLoadingProducts(true);
    setIsLoadingStaff(true);
    try {
      const [productsRes, rolesRes, staffRes] = await Promise.all([
        fetch('/api/products'), fetch('/api/roles'), fetch('/api/staff')
      ]);
      const productsData = await productsRes.json();
      const rolesData = await rolesRes.json();
      const staffData = await staffRes.json();
      
      setProducts(productsData);
      setRoles(rolesData);
      setStaff(staffData);

      if (rolesData.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesData[0].id);
      }
    } catch (error) {
      console.error('Error al cargar los datos del dashboard:', error);
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingStaff(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Funciones CRUD de Productos ---
  const handleAddProduct = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProductName, price: parseFloat(newPrice), description: newDescription, category: newCategory }),
      });
      if (!response.ok) throw new Error('Error al crear el producto');
      setNewProductName(''); setNewPrice(''); setNewDescription(''); setNewCategory('');
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setEditedName(product.name);
    setEditedPrice(product.price.toString());
    setEditedDescription(product.description || '');
    setEditedCategory(product.category || '');
  };

  const handleUpdateProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingProduct) return;
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName, price: parseFloat(editedPrice), description: editedDescription, category: editedCategory }),
      });
      if (!response.ok) throw new Error('Error al actualizar el producto');
      setEditingProduct(null);
      fetchData();
    } catch (error) { console.error("Error:", error); }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el producto');
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };
  
  // --- Funciones CRUD de Personal ---
  const handleAddStaff = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStaffName, pin: newStaffPin, roleId: selectedRoleId }),
      });
      if (!response.ok) throw new Error('Error al crear el empleado');
      setNewStaffName('');
      setNewStaffPin('');
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };
  
  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar a este empleado?')) return;
    try {
      const response = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar el empleado');
      fetchData();
    } catch (error) { console.error('Error:', error); }
  };

  const handleEditStaffClick = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setEditedStaffName(staffMember.name);
    setEditedStaffPin(staffMember.pin);
    setEditedStaffRoleId(staffMember.roleId);
  };

  const handleUpdateStaffSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingStaff) return;
    try {
      const response = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedStaffName, pin: editedStaffPin, roleId: editedStaffRoleId }),
      });
      if (!response.ok) throw new Error('Error al actualizar el empleado');
      setEditingStaff(null);
      fetchData(); // <-- ESTO AHORA FUNCIONA
    } catch (error) { console.error("Error:", error); }
  };

  // --- Estructura Visual (JSX) ---
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* === COLUMNA IZQUIERDA: GESTIÓN DE PRODUCTOS === */}
        <section className="flex flex-col gap-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Añadir Nuevo Producto</h2>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input type="text" placeholder="Nombre del producto" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
                <input type="number" placeholder="Precio (ej: 8.50)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" step="0.01" required />
              </div>
              <input type="text" placeholder="Categoría (ej: Bebidas, Postres)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" />
              <textarea placeholder="Descripción del producto" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" rows={3}></textarea>
              <button type="submit" className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700">Añadir Producto</button>
            </form>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Mi Menú</h2>
            {isLoadingProducts ? (<p>Cargando productos...</p>) : products.length > 0 ? (
              <ul>
                {products.map((product) => (
                  <li key={product.id} className="flex flex-col items-start justify-between border-b py-4 last:border-none sm:flex-row sm:items-center">
                    <div className="mb-2 sm:mb-0">
                      <p className="font-semibold text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.description}</p>
                    </div>
                    <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end shrink-0">
                      <p className="font-mono text-lg font-semibold text-blue-600">${product.price.toFixed(2)}</p>
                      <button onClick={() => handleEditProductClick(product)} className="ml-4 rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">Editar</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="ml-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (<p className="text-center text-gray-500">No hay productos para mostrar.</p>)}
          </div>
        </section>

        {/* === COLUMNA DERECHA: GESTIÓN DE PERSONAL === */}
        <section className="flex flex-col gap-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Añadir Empleado</h2>
            <form onSubmit={handleAddStaff} className="flex flex-col gap-4">
              <input type="text" placeholder="Nombre del empleado" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input type="text" placeholder="PIN de 4 dígitos" value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
                <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required>
                  <option value="" disabled>Selecciona un rol</option>
                  {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                </select>
              </div>
              <button type="submit" className="w-full rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700">Añadir Empleado</button>
            </form>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Mi Personal</h2>
            {isLoadingStaff ? (<p>Cargando personal...</p>) : staff.length > 0 ? (
              <ul>
                {staff.map((member) => (
                  <li key={member.id} className="flex items-center justify-between border-b py-3 last:border-none">
                    <div>
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 inline-block mt-1">{member.role.name}</p>
                    </div>
                    <div className="shrink-0">
                      <button onClick={() => handleEditStaffClick(member)} className="ml-4 rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">Editar</button>
                      <button onClick={() => handleDeleteStaff(member.id)} className="ml-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (<p className="text-center text-gray-500">No has añadido personal.</p>)}
          </div>
        </section>
      </div>

      {/* --- Modales de Edición --- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Editar Producto</h2>
            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <input type="number" value={editedPrice} onChange={(e) => setEditedPrice(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <input type="text" value={editedCategory} onChange={(e) => setEditedCategory(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setEditingProduct(null)} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Editar Empleado</h2>
            <form onSubmit={handleUpdateStaffSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" value={editedStaffName} onChange={(e) => setEditedStaffName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">PIN</label>
                <input type="text" value={editedStaffPin} onChange={(e) => setEditedStaffPin(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <select value={editedStaffRoleId} onChange={(e) => setEditedStaffRoleId(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required>
                  {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setEditingStaff(null)} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}