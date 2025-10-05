// src/components/order/ModifierModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductWithRelations, ModifierOption } from '../../types';

interface ModifierModalProps {
  product: ProductWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: ProductWithRelations, selectedOptions: ModifierOption[], notes: string) => void;
}

export default function ModifierModal({ product, isOpen, onClose, onAddToCart }: ModifierModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<ModifierOption[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedOptions([]);
      setNotes('');
    }
  }, [isOpen, product.id]);

  if (!isOpen) {
    return null;
  }

  const handleOptionChange = (option: ModifierOption, isChecked: boolean) => {
    setSelectedOptions(prev =>
      isChecked ? [...prev, option] : prev.filter(item => item.id !== option.id)
    );
  };

  const calculateTotalPrice = () => {
    const optionsPrice = selectedOptions.reduce((total, option) => total + option.price, 0);
    return product.price + optionsPrice;
  };

  const handleConfirm = () => {
    onAddToCart(product, selectedOptions, notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          
          {/* --- CÓDIGO DE MODIFICADORES REINSERTADO --- */}
          {product.modifierGroups.length > 0 && product.modifierGroups.map(group => (
            <div key={group.id}>
              <h3 className="font-semibold border-b pb-1 mb-2">{group.name}</h3>
              <div className="space-y-2">
                {group.options.map(option => (
                  <label key={option.id} className="flex items-center justify-between cursor-pointer p-2 rounded-md hover:bg-gray-100">
                    <span className="text-gray-700">{option.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-600">+${option.price.toFixed(2)}</span>
                      <input
                        type="checkbox"
                        checked={selectedOptions.some(so => so.id === option.id)}
                        onChange={(e) => handleOptionChange(option, e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {/* --- FIN DEL CÓDIGO REINSERTADO --- */}

          <div className="pt-2">
            <label htmlFor="order-notes" className="block text-sm font-semibold text-gray-700">
              Instrucciones Especiales (Notas)
            </label>
            <textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: sin lechuga, término medio, extra picante..."
              className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-lg font-bold font-mono ml-2">${calculateTotalPrice().toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Añadir al Pedido</button>
          </div>
        </div>
      </div>
    </div>
  );
}