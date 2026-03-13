import prisma from "@/lib/prisma";
import PescariasClient from "./PescariasClient";
import { getSpeciesSuggestions } from "../actions";

export default async function Pescarias() {
    const fishermen = await prisma.fisherman.findMany({ orderBy: { name: 'asc' } });
    const speciesSuggestions = await getSpeciesSuggestions();
    
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
                <h1>Pescarias & Controle</h1>
            </div>

            <PescariasClient 
                fishermen={fishermen} 
                speciesSuggestions={speciesSuggestions}
                allLandings={allLandings}
                allExpenses={allExpenses}
            />
        </div>
    );
}
