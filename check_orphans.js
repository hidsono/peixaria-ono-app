const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const expenses = await prisma.expense.findMany({
      where: { fisherman: null }
    });
    console.log('Orphaned expenses:', expenses.length);
    if (expenses.length > 0) {
      console.log('Fixing orphaned expenses...');
      // Talvez deletar ou associar a um pescador padrão?
      // Por enquanto só listar.
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
