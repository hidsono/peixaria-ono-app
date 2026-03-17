import prisma from "@/lib/prisma";
import PescariasClient from "./PescariasClient";
import { getProducts } from "../actions";

export default async function Pescarias() {
    const fishermen = await prisma.fisherman.findMany({ orderBy: { name: 'asc' } });
    const products = await getProducts();
    
    const allLandings = await prisma.landing.findMany({
        orderBy: { date: 'desc' },
        include: { fisherman: true }
    });

    const allExpenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' },
        include: { fisherman: true }
    });

    return (
        <div>
            <div className="no-print">
                <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-6">Pescarias & Controle</h1>
            </div>

            <PescariasClient 
                fishermen={fishermen} 
                products={products}
                allLandings={allLandings}
                allExpenses={allExpenses}
            />
        </div>
    );
}
