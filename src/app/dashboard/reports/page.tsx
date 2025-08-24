// src/app/dashboard/reports/page.tsx
import SalesReport from "@/components/dashboard/SalesReport";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <SalesReport />
      </div>
    </main>
  );
}