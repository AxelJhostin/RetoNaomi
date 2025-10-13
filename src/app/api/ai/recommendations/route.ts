// src/app/api/ai/recommendations/route.ts
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface ReportData {
  kpis: { totalRevenue: number; totalOrders: number; averageOrderValue: number; };
  topProducts: { name: string; count: number; revenue: number }[];
  topModifiers: { name: string; count: number; revenue: number }[];
  salesByDay: { date: string; total: number }[];
}

// URL del modelo de IA que usaremos en Hugging Face (un modelo potente y rápido)
const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

export async function POST(request: NextRequest) {
  try {
    const reportData: ReportData = await request.json();

    // 1. Verificamos la nueva API Key de Hugging Face
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error("API Key de Hugging Face no encontrada en el archivo .env");
    }

    // 2. Mantenemos el mismo prompt excelente que ya tenías
    const prompt = `
      Eres un asesor experto en gestión de restaurantes. Analiza los siguientes datos de ventas y proporciona 3 recomendaciones cortas y accionables.

      Aquí están los datos:
      - Ingresos Totales: $${reportData.kpis.totalRevenue.toFixed(2)}
      - Total de Órdenes: ${reportData.kpis.totalOrders}

      Productos más vendidos (cantidad x nombre):
      ${reportData.topProducts.map((p) => `- ${p.count}x ${p.name}`).join('\n')}

      Basado en estos datos, dame tus 3 mejores recomendaciones en formato de lista simple.
    `;

    // 3. Hacemos la llamada a la API de Hugging Face
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Error de la API de Hugging Face: ${response.status} ${errorBody}`);
    }

    const result = await response.json();
    
    // 4. Extraemos la respuesta (Hugging Face la devuelve en 'generated_text')
    // El resultado del prompt a veces se incluye, así que lo limpiamos.
    let recommendations = result[0]?.generated_text || 'No se pudieron generar recomendaciones.';
    if (recommendations.startsWith(prompt)) {
        recommendations = recommendations.substring(prompt.length).trim();
    }


    return NextResponse.json({ recommendations });

  } catch (error) {
    console.error("Error en la API de IA (Hugging Face):", error);
    return NextResponse.json({ error: 'No se pudieron generar las recomendaciones.' }, { status: 500 });
  }
}