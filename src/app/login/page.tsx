// src/app/login/page.tsx
// --- ESTE ES EL CÓDIGO CORRECTO PARA EL LOGIN DE NEGOCIO ---
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessLoginPage() {
  const [businessUsername, setBusinessUsername] = useState('');
  const [businessPassword, setBusinessPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/business-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessUsername, businessPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error de autenticación');
      }

      // Si el login es exitoso, redirigimos a la página "Portal"
      router.push(`/portal/${data.restaurantId}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Acceso de Negocio</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="businessUsername" className="block text-sm font-medium text-gray-700">
              Usuario del Negocio
            </label>
            <input
              type="text"
              id="businessUsername"
              value={businessUsername}
              onChange={(e) => setBusinessUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="businessPassword" className="block text-sm font-medium text-gray-700">
              Contraseña del Negocio
            </label>
            <input
              type="password"
              id="businessPassword"
              value={businessPassword}
              onChange={(e) => setBusinessPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}