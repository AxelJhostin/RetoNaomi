// src/components/modifiers/ModifierGroupCard.tsx
'use client';

import { useState, FormEvent } from 'react';

// Tipos que ya tenemos en nuestra página principal
interface ModifierOption {
  id: string;
  name:string;
  price: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  options: ModifierOption[];
}

interface ModifierGroupCardProps {
  group: ModifierGroup;
  onUpdate: () => void;
  onDeleteGroup: (groupId: string) => void; // <-- AÑADE ESTA LÍNEA
}

export default function ModifierGroupCard({ group, onUpdate, onDeleteGroup }: ModifierGroupCardProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingOptionName, setEditingOptionName] = useState('');
  const [editingOptionPrice, setEditingOptionPrice] = useState('');

  const handleAddOption = async (e: FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim() || !newOptionPrice) return;

    try {
      // Este es el endpoint para el cual ya tenías código
      const res = await fetch(`/api/modifier-groups/${group.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newOptionName,
          price: parseFloat(newOptionPrice),
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo añadir la opción');
      }

      setNewOptionName('');
      setNewOptionPrice('');
      onUpdate(); // Llamamos a la función onUpdate para recargar los datos de toda la página
    } catch (error) {
      console.error('Error al añadir opción:', error);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta opción?')) return;
    
    try {
      const res = await fetch(`/api/modifier-groups/${group.id}/options/${optionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('No se pudo eliminar la opción');
      
      onUpdate(); // Refrescamos para que la opción desaparezca
    } catch (error) {
      console.error('Error al eliminar opción:', error);
    }
  };

  const handleEditOptionClick = (option: ModifierOption) => {
    setEditingOptionId(option.id);
    setEditingOptionName(option.name);
    setEditingOptionPrice(option.price.toString());
  };

  const handleCancelEditOption = () => {
    setEditingOptionId(null);
  };

  const handleSaveOption = async (optionId: string) => {
    try {
      const res = await fetch(`/api/modifier-groups/${group.id}/options/${optionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingOptionName, price: editingOptionPrice }),
      });
      if (!res.ok) throw new Error('No se pudo actualizar la opción');
      
      setEditingOptionId(null);
      onUpdate();
    } catch (error) {
      console.error('Error al guardar la opción:', error);
    }
  };

  return (
    <div className="border p-4 rounded-md bg-gray-50">
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
        <button
          onClick={() => onDeleteGroup(group.id)}
          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
          title="Eliminar Grupo Completo"
        >
          Eliminar Grupo
        </button>
      </div>
      
      <ul className="mt-2 space-y-2">
        {/* Mostramos la lista de opciones existentes */}
        {group.options.length > 0 ? (
          group.options.map(option => (
            <li key={option.id} className="flex justify-between items-center text-sm p-2 bg-white rounded-md shadow-sm min-h-[50px]">
              {editingOptionId === option.id ? (
                // --- VISTA DE EDICIÓN DE LA OPCIÓN ---
                <div className="flex-grow flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={editingOptionName} 
                    onChange={(e) => setEditingOptionName(e.target.value)} 
                    className="flex-grow rounded-md border-gray-300 p-1 text-sm" 
                  />
                  <input 
                    type="number" 
                    value={editingOptionPrice} 
                    onChange={(e) => setEditingOptionPrice(e.target.value)} 
                    className="w-20 rounded-md border-gray-300 p-1 text-sm" 
                    step="0.01" 
                  />
                  <button onClick={() => handleSaveOption(option.id)} className="text-green-600 font-bold hover:text-green-800">Guardar</button>
                  <button onClick={handleCancelEditOption} className="text-gray-500 hover:text-gray-700">Cancelar</button>
                </div>
              ) : (
                // --- VISTA NORMAL DE LA OPCIÓN ---
                <>
                  <div>
                    <span>{option.name}</span>
                    <span className="font-mono text-gray-600 ml-2">+${option.price.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => handleEditOptionClick(option)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold">EDITAR</button>
                    <button 
                      onClick={() => handleDeleteOption(option.id)} 
                      className="font-bold text-red-500 hover:text-red-700 text-lg leading-none" 
                      title="Eliminar Opción"
                    >
                      &times;
                    </button>
                  </div>
                </>
              )}
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">No hay opciones en este grupo.</p>
        )}
      </ul>

      {/* Formulario para añadir nuevas opciones */}
      <form onSubmit={handleAddOption} className="flex flex-col sm:flex-row gap-2 border-t mt-4 pt-4">
        <input
          type="text"
          placeholder="Nombre opción (ej: Queso)"
          value={newOptionName}
          onChange={(e) => setNewOptionName(e.target.value)}
          className="flex-grow rounded-md border border-gray-300 p-2 text-sm"
          required
        />
        <input
          type="number"
          placeholder="Precio extra (ej: 1.50)"
          value={newOptionPrice}
          onChange={(e) => setNewOptionPrice(e.target.value)}
          className="w-full sm:w-32 rounded-md border border-gray-300 p-2 text-sm"
          step="0.01"
          required
        />
        <button type="submit" className="rounded-md bg-green-600 px-3 py-2 text-white text-sm hover:bg-green-700 shrink-0">
          Añadir Opción
        </button>
      </form>
    </div>
  );
}