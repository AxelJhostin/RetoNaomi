// src/app/api/ai/recommendations/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// --- Definimos los tipos de datos que esperamos recibir ---
interface ReportData {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  topProducts: { name: string; count: number; revenue: number }[];
  topModifiers: { name: string; count: number; revenue: number }[];
  salesByDay: { date: string; total: number }[];
}
// ----------------------------------------------------

export async function POST(request: Request) {
  try {
    const reportData: ReportData = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key de Gemini no encontrada en el archivo .env");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      Eres un asesor experto en gestión de restaurantes. Analiza los siguientes datos de ventas de un restaurante llamado "Tap&Order" y proporciona 3 recomendaciones cortas, claras y accionables para que el dueño pueda aumentar sus ingresos o mejorar la operación. Sé directo y amigable.

      Aquí están los datos:
      - Ingresos Totales: $${reportData.kpis.totalRevenue.toFixed(2)}
      - Total de Órdenes: ${reportData.kpis.totalOrders}
      - Valor Promedio por Orden: $${reportData.kpis.averageOrderValue.toFixed(2)}

      Productos más vendidos (cantidad x nombre = ingresos):
      ${reportData.topProducts.map((p) => `- ${p.count}x ${p.name} = $${p.revenue.toFixed(2)}`).join('\n')}

      Modificadores más populares (cantidad x nombre = ingresos):
      ${reportData.topModifiers.map((m) => `- ${m.count}x ${m.name} = $${m.revenue.toFixed(2)}`).join('\n')}

      Ventas por día (fecha = total):
      ${reportData.salesByDay.map((d) => `- ${d.date} = $${d.total.toFixed(2)}`).join('\n')}

      Basado en estos datos, dame tus 3 mejores recomendaciones en formato de lista.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const recommendations = response.text();

    return NextResponse.json({ recommendations });

  } catch (error) {
    console.error("Error en la API de IA:", error);
    return NextResponse.json({ error: 'No se pudieron generar las recomendaciones.' }, { status: 500 });
  }
}