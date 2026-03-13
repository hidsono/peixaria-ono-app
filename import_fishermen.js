const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log('No user found to assign records.');
        return;
    }

    const content = fs.readFileSync('fishermen_clean.txt', 'utf8');
    const lines = content.split('\n').filter(l => l.trim());

    // Header: Embarcação|Pescador|RGP|CPF|Método
    const records = lines.slice(1);

    for (const line of records) {
        const [boat_name, name, rgp, cpf, metodo] = line.split('|');
        if (!name) continue;

        try {
            await prisma.fisherman.create({
                data: {
                    name: name.trim(),
                    boat_name: boat_name ? boat_name.trim() : null,
                    rgp: rgp ? rgp.trim() : null,
                    cpf: cpf ? cpf.trim() : null,
                    metodo: metodo ? metodo.trim() : null,
                    createdById: user.id
                }
            });
            console.log(`Pescador cadastrado: ${name}`);
        } catch (error) {
            console.error(`Erro ao cadastrar ${name}:`, error.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
