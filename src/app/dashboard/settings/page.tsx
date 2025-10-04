// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';

// Definimos un tipo para los datos de configuración
interface SettingsData {
  restaurantName: string;
  restaurantAddress: string;
  taxId: string;
  taxRate: number;
  serviceChargeRate: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    restaurantName: '',
    restaurantAddress: '',
    taxId: '',
    taxRate: 0.12,
    serviceChargeRate: 0.10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Obtenemos la configuración actual al cargar la página
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('No se pudo cargar la configuración.');
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Error al cargar los datos.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Manejador para actualizar el estado del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Manejador para guardar los cambios
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('No se pudieron guardar los cambios.');
      setMessage({ type: 'success', text: '¡Configuración guardada con éxito!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar. Inténtalo de nuevo.' });
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-8">Cargando configuración...</div>;
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Configuración del Restaurante</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          &larr; Volver al Dashboard
        </Link>
      </header>
      
      <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-lg shadow-md space-y-6">
        <div>
          <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">Nombre del Restaurante</label>
          <input type="text" name="restaurantName" id="restaurantName" value={settings.restaurantName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="restaurantAddress" className="block text-sm font-medium text-gray-700">Dirección</label>
          <input type="text" name="restaurantAddress" id="restaurantAddress" value={settings.restaurantAddress || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">RUC / ID Fiscal</label>
          <input type="text" name="taxId" id="taxId" value={settings.taxId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">Tasa de IVA (ej: 0.12 para 12%)</label>
            <input type="number" step="0.01" name="taxRate" id="taxRate" value={settings.taxRate || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="serviceChargeRate" className="block text-sm font-medium text-gray-700">Tasa de Servicio (ej: 0.10 para 10%)</label>
            <input type="number" step="0.01" name="serviceChargeRate" id="serviceChargeRate" value={settings.serviceChargeRate || 0} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-4 border-t">
            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
                Guardar Cambios
            </button>
        </div>
      </form>
    </main>
  );
}