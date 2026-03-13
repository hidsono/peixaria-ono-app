const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('Tentando conectar ao banco...');
        const userCount = await prisma.user.count();
        console.log('Conexão bem sucedida!');
        console.log('Total de usuários vinculados:', userCount);

        if (userCount > 0) {
            const users = await prisma.user.findMany({ select: { username: true, name: true } });
            console.log('Usuários encontrados:', users);
        } else {
            console.log('Nenhum usuário encontrado no banco.');
        }
    } catch (e) {
        console.error('ERRO DE CONEXÃO:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
