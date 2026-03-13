const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
    return createHash('sha256').update(password).digest('hex');
}

async function main() {
    const username = 'admin';
    const password = 'hideo'; // Change this if needed
    const name = 'Admin Peixaria';

    const existing = await prisma.user.findUnique({
        where: { username }
    });

    if (existing) {
        console.log('User admin already exists.');
        return;
    }

    await prisma.user.create({
        data: {
            username,
            password: hashPassword(password),
            name
        }
    });

    console.log('User admin created successfully.');
    console.log('Username: admin');
    console.log('Password: hideo');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
