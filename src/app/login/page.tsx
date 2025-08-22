// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Nuevos estados para una mejor experiencia de usuario
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); // Empezamos la carga
    setError(null);   // Limpiamos errores anteriores

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Si la respuesta es exitosa (status 200-299)
        console.log('Login exitoso:', data);
        router.push('/dashboard');
        // Aquí, en el futuro, redirigiremos al usuario al dashboard
      } else {
        // Si hay un error (status 4xx, 5xx)
        console.error('Error en el login:', data);
        setError(data.message || 'Ocurrió un error.');
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      setError('No se pudo conectar al servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false); // Terminamos la carga
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Iniciar Sesión
        </h1>
        <p className="mb-8 text-center text-gray-600">
          Bienvenido a Tap&Order
        </p>

        <form onSubmit={handleSubmit}>
          {/* Mostramos el mensaje de error si existe */}
          {error && (
            <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading} // Deshabilitamos el input mientras carga
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading} // Deshabilitamos el input mientras carga
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading} // Deshabilitamos el botón mientras carga
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}