// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

// Inicializamos Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el script de seeding...');

  // 1. Creamos el usuario "dueño"
  const password = '123456'; // La contraseña que usarás para iniciar sesión
  const hashedPassword = hashSync(password, 10);

  const owner = await prisma.user.create({
    data: {
      email: 'naomi@duenia.com', // El email para iniciar sesión
      name: 'Dueño del Restaurante',
      password: hashedPassword,
    },
  });

  console.log(`✅ Usuario dueño creado con el email: ${owner.email}`);
  console.log('Script de seeding completado.');
}

// Ejecutamos la función main y nos aseguramos de desconectar de la BD
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });