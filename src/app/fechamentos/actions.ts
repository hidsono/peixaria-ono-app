"use server";

import prisma from "@/lib/prisma";

export async function getSettlementData(fishermanId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const landings = await prisma.landing.findMany({
        where: {
            fishermanId,
            date: { gte: start, lte: end }
        }
    });

    const expenses = await prisma.expense.findMany({
        where: {
            fishermanId,
            date: { gte: start, lte: end }
        }
    });

    // Agrupar por espécie
    const groupedLandings: Record<string, number> = {};
    landings.forEach(l => {
        groupedLandings[l.species] = (groupedLandings[l.species] || 0) + l.weight_kg;
    });

    return {
        groupedLandings: Object.entries(groupedLandings).map(([species, weight]) => ({ species, weight })),
        expenses,
        totalExpenses: expenses.reduce((acc, curr) => acc + curr.amount, 0)
    };
}

export async function createSettlement(data: {
    fishermanId: string;
    start_date: string;
    end_date: string;
    gross_total: number;
    expenses_total: number;
    net_total: number;
    adjustedExpenses?: { id: string, amount: number }[];
}) {
    return await prisma.$transaction(async (tx) => {
        // Se houver despesas ajustadas, atualiza-as no banco
        if (data.adjustedExpenses && data.adjustedExpenses.length > 0) {
            for (const adj of data.adjustedExpenses) {
                await tx.expense.update({
                    where: { id: adj.id },
                    data: { amount: adj.amount }
                });
            }
        }

        return await tx.settlement.create({
            data: {
                fishermanId: data.fishermanId,
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                gross_total: data.gross_total,
                expenses_total: data.expenses_total,
                net_total: data.net_total,
            }
        });
    });
}
