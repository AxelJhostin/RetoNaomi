'use client';
import { useState, useEffect, FormEvent } from 'react';

interface Table {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'BILLING';
}

export default function TableManager() {
  const [tables, setTables] = useState<Table[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para la edición
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editedName, setEditedName] = useState('');

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      setTables(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTableName }),
      });
      if (!res.ok) throw new Error('Error al crear la mesa');
      setNewTableName('');
      fetchTables();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditClick = (table: Table) => {
    setEditingTable(table);
    setEditedName(table.name);
  };

  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    try {
      const res = await fetch(`/api/tables/${editingTable.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName }),
      });
      if (!res.ok) throw new Error('Error al actualizar la mesa');
      setEditingTable(null);
      fetchTables();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mesa?')) return;
    try {
      const res = await fetch(`/api/tables/${tableId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la mesa');
      fetchTables();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <section className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Mesas</h1>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Añadir Nueva Mesa</h2>
          <form onSubmit={handleAddTable} className="flex gap-4">
            <input
              type="text"
              placeholder="Nombre (ej: Mesa 1, Barra 2)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="flex-grow rounded-md border border-gray-300 p-2"
              required
            />
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Añadir</button>
          </form>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Mis Mesas</h2>
          {isLoading ? ( <p>Cargando mesas...</p> ) 
          : tables.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {tables.map((table) => (
                <div key={table.id} className="relative group rounded-lg border bg-green-100 p-4 text-center">
                  <p className="font-bold">{table.name}</p>
                  <p className="text-sm text-green-800">{table.status}</p>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(table)} className="h-6 w-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center hover:bg-yellow-700" title="Editar mesa">E</button>
                    <button onClick={() => handleDeleteTable(table.id)} className="h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-700" title="Eliminar mesa">X</button>
                  </div>
                </div>
              ))}
            </div>
          ) : ( <p>No has añadido mesas.</p> )}
        </div>
      </section>

      {/* Modal de Edición de Mesa */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Editar Mesa</h2>
            <form onSubmit={handleUpdateSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre de la Mesa</label>
                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setEditingTable(null)} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}