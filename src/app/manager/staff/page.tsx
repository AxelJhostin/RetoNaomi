// src/app/manager/staff/page.tsx
'use client';

import StaffManager from '@/components/dashboard/StaffManager';
import Link from 'next/link';

export default function ManageStaffPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestión de Personal</h1>
        <Link href="/manager" className="text-blue-600 hover:underline">
          &larr; Volver al Panel de Gerente
        </Link>
      </header>

      {/* Aquí simplemente reutilizamos el componente que ya tienes */}
      <div className="max-w-4xl mx-auto">
        <StaffManager />
      </div>
    </main>
  );
}