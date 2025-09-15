// src/components/dashboard/RoleManager.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Role {
  id: string;
  name: string;
}

export default function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener la lista de roles
  const fetchRoles = async () => {
    try {
      setError(null);
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('No se pudieron cargar los roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      // --- BLOQUE CATCH CORREGIDO ---
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar los roles cuando el componente se monta
  useEffect(() => {
    fetchRoles();
  }, []);

  // Función para manejar la creación de un nuevo rol
  const handleAddRole = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear el rol');
      }

      setNewRoleName('');
      fetchRoles(); // Recargamos la lista para ver el nuevo rol
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al crear el rol');
      }
    }
  };

  // Función para eliminar un rol
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este rol?')) return;
    setError(null);

    try {
      const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar el rol');
      }

      fetchRoles(); // Recargamos la lista
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al eliminar el rol');
      }
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold">Gestionar Roles</h2>
      
      {/* Formulario para añadir un nuevo rol */}
      <form onSubmit={handleAddRole} className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Nombre del nuevo rol (ej: Admin)"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          className="flex-grow rounded-md border border-gray-300 p-2"
          required
        />
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Añadir Rol
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Lista de roles existentes */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Roles Actuales</h3>
        {isLoading ? (
          <p>Cargando roles...</p>
        ) : (
          <ul>
            {roles.map(role => (
              <li key={role.id} className="flex items-center justify-between border-b py-2 last:border-none">
                <span className="text-gray-800">{role.name}</span>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}