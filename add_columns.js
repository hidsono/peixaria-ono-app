const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Adicionando novos campos à tabela Fisherman ---');

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Fisherman" ADD COLUMN IF NOT EXISTS "rgp" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Fisherman" ADD COLUMN IF NOT EXISTS "cpf" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "Fisherman" ADD COLUMN IF NOT EXISTS "metodo" TEXT;`);
        console.log('✅ Colunas rgp, cpf e metodo adicionadas com sucesso.');
    } catch (e) {
        console.error('❌ Erro ao adicionar colunas:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
