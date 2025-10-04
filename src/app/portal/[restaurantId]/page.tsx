// src/app/portal/[restaurantId]/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Componente para el Login del Dueño
function OwnerLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Usamos la API de login de dueño que ya tenías
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // Si es exitoso, lo mandamos al dashboard principal
      router.push('/dashboard');

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h2 className="text-xl font-bold mb-6 text-center">Acceso Dueño / Dashboard</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... inputs para email y password ... */}
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50">
          {isLoading ? 'Entrando...' : 'Acceder al Dashboard'}
        </button>
      </form>
    </div>
  );
}

// Componente para el Login del Personal
function StaffPinForm() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Usamos la API de login de personal que ya tenías
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      // La lógica de redirección por rol que ya habías implementado
      if (data.user.role === 'Gerente') router.push('/manager');
      else if (data.user.role === 'Mesero') router.push('/waiter');
      else if (data.user.role === 'Cocinero') router.push('/kitchen');
      else throw new Error(`Rol "${data.user.role}" no reconocido.`);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-xs">
      <h2 className="text-xl font-bold mb-6 text-center">Acceso Personal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pin" className="text-center block">PIN</label>
          <input type="password" id="pin" value={pin} onChange={e => setPin(e.target.value)} required maxLength={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-center text-2xl tracking-[.5em]" />
        </div>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-green-600 px-4 py-2 text-white font-semibold hover:bg-green-700 disabled:opacity-50">
          {isLoading ? '...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}


// Componente Principal de la Página Portal
export default function PortalPage() {
    const params = useParams();
    const restaurantId = params.restaurantId;

    // Aquí podríamos hacer un fetch para obtener el nombre del restaurante y mostrarlo
    // Por ahora, lo mantenemos simple.

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-center mb-10">Bienvenido</h1>
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <OwnerLoginForm />
        <div className="text-center font-bold text-gray-500 my-4 md:my-16">O</div>
        <StaffPinForm />
      </div>
    </main>
  );
}