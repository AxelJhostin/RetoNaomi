// src/components/StaffManager.tsx
'use client';
import { useState, useEffect, FormEvent } from 'react';

// Definición de Tipos
interface Role {
  id: string;
  name: string;
}
interface Staff {
  id: string;
  name: string;
  pin: string;
  role: Role;
  roleId: string;
}

export default function StaffManager() {
  // Estados para Personal
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // Estados para la edición
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedPin, setEditedPin] = useState('');
  const [editedRoleId, setEditedRoleId] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, staffRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/staff'),
      ]);
      const rolesData = await rolesRes.json();
      const staffData = await staffRes.json();
      
      setRoles(rolesData);
      setStaff(staffData);

      if (rolesData.length > 0 && !selectedRoleId) {
        setSelectedRoleId(rolesData[0].id);
      }
    } catch (error) {
      console.error('Error al cargar datos del personal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStaff = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, pin: newPin, roleId: selectedRoleId }),
      });
      if (!res.ok) throw new Error('Error al crear empleado');
      setNewName('');
      setNewPin('');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleEditClick = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setEditedName(staffMember.name);
    setEditedPin(staffMember.pin);
    setEditedRoleId(staffMember.roleId);
  };
  
  const handleUpdateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const res = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName, pin: editedPin, roleId: editedRoleId }),
      });
      if (!res.ok) throw new Error('Error al actualizar empleado');
      setEditingStaff(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleDelete = async (staffId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este empleado?')) return;
    try {
      const res = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar empleado');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <section className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Personal</h1>
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Añadir Empleado</h2>
          <form onSubmit={handleAddStaff} className="flex flex-col gap-4">
            <input type="text" placeholder="Nombre del empleado" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input type="text" placeholder="PIN de 4 dígitos" value={newPin} onChange={(e) => setNewPin(e.target.value)} className="w-full rounded-md border border-gray-300 p-2" required />
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
          {isLoading ? (<p>Cargando...</p>) : staff.length > 0 ? (
            <ul>
              {staff.map((member) => (
                <li key={member.id} className="flex items-center justify-between border-b py-3 last:border-none">
                  <div>
                    <p className="font-semibold text-gray-800">{member.name}</p>
                    <p className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700 inline-block mt-1">{member.role.name}</p>
                  </div>
                  <div className="shrink-0">
                    <button onClick={() => handleEditClick(member)} className="ml-4 rounded-md bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600">Editar</button>
                    <button onClick={() => handleDelete(member.id)} className="ml-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600">Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (<p>No has añadido personal.</p>)}
        </div>
      </section>

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">Editar Empleado</h2>
            <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">PIN</label>
                <input type="text" value={editedPin} onChange={(e) => setEditedPin(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <select value={editedRoleId} onChange={(e) => setEditedRoleId(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 p-2" required>
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
    </>
  );
}