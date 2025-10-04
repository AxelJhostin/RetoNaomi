// src/app/api/settings/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// --- FUNCIÓN PARA OBTENER LA CONFIGURACIÓN ACTUAL ---
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticamos al dueño con su token
    const ownerToken = request.cookies.get('token')?.value;
    if (!ownerToken) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(ownerToken, secret);
    const ownerId = payload.id as string;

    // 2. Buscamos al usuario y seleccionamos solo los campos de configuración
    const settings = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        restaurantName: true,
        restaurantAddress: true,
        taxId: true,
        taxRate: true,
        serviceChargeRate: true,
      },
    });

    if (!settings) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Devolvemos la configuración
    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}


// --- FUNCIÓN PARA ACTUALIZAR LA CONFIGURACIÓN ---
export async function PUT(request: NextRequest) {
  try {
    // 1. Autenticamos al dueño con su token
    const ownerToken = request.cookies.get('token')?.value;
    if (!ownerToken) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(ownerToken, secret);
    const ownerId = payload.id as string;

    // 2. Obtenemos los nuevos datos del cuerpo de la petición
    const body = await request.json();
    const { restaurantName, restaurantAddress, taxId, taxRate, serviceChargeRate } = body;
    
    // 3. Actualizamos el registro del usuario con la nueva información
    const updatedUser = await prisma.user.update({
      where: { id: ownerId },
      data: {
        restaurantName,
        restaurantAddress,
        taxId,
        // Convertimos a número flotante para asegurar el tipo correcto
        taxRate: parseFloat(taxRate), 
        serviceChargeRate: parseFloat(serviceChargeRate),
      },
    });

    // 4. Devolvemos una respuesta exitosa
    return NextResponse.json({ message: 'Configuración guardada con éxito' }, { status: 200 });
  
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}