const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding NotificationRecipient table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationRecipient" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "NotificationRecipient_phone_key" ON "NotificationRecipient"("phone");
    `);

    console.log('Table NotificationRecipient created successfully.');
  } catch (e) {
    console.error('Failed to create table:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
