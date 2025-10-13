// src/app/api/categories/[id]/route.ts
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// La función GET se mantiene igual, pero la revisamos por si acaso
export async function GET(
    request: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        const category = await prisma.category.findUnique({
            where: { id: params.id }
        });
        if (!category) {
            return NextResponse.json({ message: 'Categoría no encontrada' }, { status: 404 });
        }
        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
    }
}

// --- FUNCIÓN PUT CORREGIDA ---
// Añadimos 'request: NextRequest' como el primer argumento
export async function PUT(
    request: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name } = body;

        const updatedCategory = await prisma.category.update({
            where: { id: params.id },
            data: { name },
        });

        return NextResponse.json(updatedCategory);
    } catch (error) {
        return NextResponse.json({ message: 'Error al actualizar la categoría' }, { status: 500 });
    }
}

// La función DELETE se mantiene igual, pero la revisamos
export async function DELETE(
    request: NextRequest, 
    { params }: { params: { id: string } }
) {
    try {
        await prisma.category.delete({
            where: { id: params.id },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ message: 'Error al eliminar la categoría' }, { status: 500 });
    }
}