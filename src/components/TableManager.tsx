// src/components/TableManager.tsx
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

  return (
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
          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Añadir
          </button>
        </form>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Mis Mesas</h2>
        {isLoading ? (
          <p>Cargando mesas...</p>
        ) : tables.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {tables.map((table) => (
              <div key={table.id} className="rounded-lg border bg-green-100 p-4 text-center">
                <p className="font-bold">{table.name}</p>
                <p className="text-sm text-green-800">{table.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No has añadido mesas.</p>
        )}
      </div>
    </section>
  );
}