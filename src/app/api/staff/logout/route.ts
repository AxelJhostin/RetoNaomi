// src/app/api/staff/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  // 1. Creamos una respuesta exitosa
  const response = NextResponse.json({ success: true });

  // 2. Usamos la respuesta para borrar la cookie
  response.cookies.delete('staff_token');

  // 3. Enviamos la respuesta
  return response;
}