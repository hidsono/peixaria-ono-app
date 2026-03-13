const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando reparo do banco de dados ---');

    try {
        console.log('1. Criando tabela de usuários...');
        // SQL para criar a tabela User se ela não existir
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "User" (
                "id" TEXT NOT NULL,
                "username" TEXT NOT NULL,
                "password" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "role" TEXT NOT NULL DEFAULT 'staff',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "User_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('✅ Tabela User criada ou já existente.');

        console.log('2. Criando índice único para username...');
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
        `);
        console.log('✅ Índice de username ok.');

        console.log('3. Adicionando campos de auditoria nas outras tabelas...');

        // Adicionar campos de auditoria se não existirem
        const tables = ['Fisherman', 'Landing', 'Expense', 'Settlement'];
        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "createdById" TEXT;`);
                await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
                await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;`);
                console.log(`✅ Colunas de auditoria adicionadas em ${table}.`);
            } catch (e) {
                console.log(`⚠️ Aviso em ${table}: ${e.message}`);
            }
        }

        console.log('\n--- Reparo concluído com sucesso! ---');
        console.log('Agora você pode rodar: node create_user.js');

    } catch (e) {
        console.error('❌ ERRO CRÍTICO NO REPARO:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
