// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

// Inicializamos Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el script de seeding...');

  // 1. Creamos el usuario "dueño" que ahora es la "Cuenta de Restaurante"
  const ownerPassword = '123456'; 
  const businessPassword = 'negocio123'; // Contraseña para el login de negocio
  
  const hashedOwnerPassword = hashSync(ownerPassword, 10);
  const hashedBusinessPassword = hashSync(businessPassword, 10);

  const owner = await prisma.user.create({
    data: {
      // Login del Dueño (para el dashboard)
      email: 'naomi@duenia.com',
      name: 'Naomi Donoso',
      password: hashedOwnerPassword,
      
      // --- NUEVOS CAMPOS AÑADIDOS ---
      // Login del Negocio (para la Puerta 1)
      businessUsername: 'naomi', // Usuario del negocio
      businessPassword: hashedBusinessPassword,
      
      // Datos de configuración iniciales
      restaurantName: 'Naomi Delicias',
      restaurantAddress: 'Sucre y Colon',
      taxId: '1316846292',
    },
  });

  console.log(`✅ Cuenta de Restaurante creada con el email: ${owner.email}`);
  console.log(`👤 Usuario de Negocio: ${owner.businessUsername}`);

  // (En el futuro, aquí también podríamos crear roles, empleados de prueba, etc.)

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