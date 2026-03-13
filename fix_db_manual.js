const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking database schema...');
    // Intenta adicionar a coluna diretamente. Se já existir, vai dar erro mas o catch pega.
    // Usamos executeRawUnsafe porque ADD COLUMN não é parametrizável facilmente.
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Expense" ADD COLUMN "quantity" DOUBLE PRECISION');
      console.log('Column "quantity" added to "Expense" table.');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Column "quantity" already exists.');
      } else {
        throw e;
      }
    }
    
    console.log('Database fix completed.');
  } catch (e) {
    console.error('Failed to fix database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
