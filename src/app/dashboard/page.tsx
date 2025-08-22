// src/app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">👑</h1>
      <h1 className="mt-4 text-4xl font-bold">Bienvenido al Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">
        Esta es una ruta protegida. Solo puedes verla si has iniciado sesión.
      </p>
    </main>
  );
}