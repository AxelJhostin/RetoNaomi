// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Obtenemos el email y la contraseña del cuerpo de la petición
    const body = await request.json();
    const { email, password } = body;

    // 2. Verificamos que nos hayan enviado ambos datos
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'El correo y la contraseña son requeridos' },
        { status: 400 } // Bad Request
      );
    }

    // 3. --- LÓGICA DE AUTENTICACIÓN (SIMULADA) ---
    // En el futuro, aquí buscaremos en la base de datos.
    // Por ahora, solo aceptaremos un usuario fijo para la prueba.
    const mockEmail = 'axel@gmail.com';
    const mockPassword = 'axel123';

    if (email === mockEmail && password === mockPassword) {
      // Si las credenciales son correctas
      return NextResponse.json(
        { success: true, message: 'Inicio de sesión exitoso' },
        { status: 200 }
      );
    } else {
      // Si las credenciales son incorrectas
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 } // Unauthorized
      );
    }
    // --- FIN DE LA LÓGICA SIMULADA ---

  } catch (error) {
  // Si ocurre cualquier otro error
  console.error('Error inesperado en el login:', error); // <-- AÑADE ESTA LÍNEA
  return NextResponse.json(
    { success: false, message: 'Ocurrió un error en el servidor' },
    { status: 500 }
  );
}
}