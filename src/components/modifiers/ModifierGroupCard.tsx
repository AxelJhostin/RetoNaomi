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
  onUpdate: () => void; // Función para refrescar los datos
}

export default function ModifierGroupCard({ group, onUpdate }: ModifierGroupCardProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState('');

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

  return (
    <div className="border p-4 rounded-md bg-gray-50">
      <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
      
      {/* Lista de opciones existentes */}
      <ul className="mt-2 space-y-1">
        {group.options.length > 0 ? (
          group.options.map(option => (
            <li key={option.id} className="flex justify-between items-center text-sm p-2 bg-white rounded-md">
              <div>
                <span>{option.name}</span>
                <span className="font-mono text-gray-600 ml-2">+${option.price.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeleteOption(option.id)}
                  className="font-bold text-red-500 hover:text-red-700 text-lg"
                  title="Eliminar Opción"
                >
                  &times;
                </button>
              </div>
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