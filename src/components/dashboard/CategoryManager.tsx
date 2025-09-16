// src/components/dashboard/CategoryManager.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Category {
  id: string;
  name: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la edición en línea
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Función para obtener la lista de categorías
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('No se pudieron cargar las categorías');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Función para AÑADIR una nueva categoría
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear la categoría');
      }
      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para ELIMINAR una categoría
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta categoría?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar la categoría');
      }
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };
  
  // Funciones para EDITAR una categoría
  const handleEditClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };
  
  const handleCancelEdit = () => {
    setEditingCategoryId(null);
  };

  const handleSaveEdit = async (categoryId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName }),
      });
       if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al actualizar la categoría');
      }
      setEditingCategoryId(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Gestionar Categorías</h2>
      
      <form onSubmit={handleAddCategory} className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nombre de la nueva categoría"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="flex-grow rounded-md border border-gray-300 p-2"
          required
        />
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Añadir Categoría
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Categorías Actuales</h3>
        {isLoading ? (
          <p>Cargando...</p>
        ) : (
          <ul>
            {categories.map(category => (
              <li key={category.id} className="flex items-center justify-between border-b py-2 last:border-none">
                {editingCategoryId === category.id ? (
                  <div className="flex-grow flex gap-2 items-center">
                    <input type="text" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="flex-grow rounded-md border-gray-300 p-1" autoFocus />
                    <button onClick={() => handleSaveEdit(category.id)} className="text-green-600 font-bold">Guardar</button>
                    <button onClick={handleCancelEdit} className="text-gray-500">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-800">{category.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(category)} className="rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">Editar</button>
                      <button onClick={() => handleDeleteCategory(category.id)} className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">Eliminar</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}