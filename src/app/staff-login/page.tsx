//src/app/staff-login/page.tsx
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Redirigir según el rol del empleado
      if (data.user.role === 'Mesero') {
        router.push('/waiter'); // Futura página del mesero
      } else if (data.user.role === 'Cocinero') {
        router.push('/kitchen'); // Futura página de la cocina
      } else {
        setError('Rol no reconocido');
      }

    } catch (err) { // Quitamos el ': any'
      if (err instanceof Error) {
        setError(err.message); // Si es un objeto Error, usamos su mensaje
      } else {
        setError('Ocurrió un error inesperado'); // Si no, un mensaje genérico
      }
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-xs rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Acceso Personal</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="pin" className="mb-2 block text-center text-sm font-medium text-gray-700">
              Ingresa tu PIN
            </label>
            <input
              type="password" // Usamos tipo password para ocultar el PIN
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-[.5em]"
              maxLength={4} // Asumimos un PIN de 4 dígitos
              required
            />
          </div>
          {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}