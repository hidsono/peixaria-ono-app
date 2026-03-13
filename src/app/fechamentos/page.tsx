export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import SettlementManager from "./SettlementManager";

export default async function Fechamentos() {
    const fishermen = await prisma.fisherman.findMany({ orderBy: { name: 'asc' } });

    return (
        <div>
            <h1>Fechamento de Acertos</h1>
            <SettlementManager fishermen={fishermen} />
        </div>
    );
}
