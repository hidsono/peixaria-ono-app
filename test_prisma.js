const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const expense = await prisma.expense.findFirst();
    console.log('Expense found:', expense);
    process.exit(0);
  } catch (e) {
    console.error('Error fetching expense:', e);
    process.exit(1);
  }
}

main();
