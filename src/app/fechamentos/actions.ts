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

    // Agrupar por espécie (Total Geral para cálculo de preço)
    const groupedLandings: Record<string, number> = {};
    landings.forEach(l => {
        groupedLandings[l.species] = (groupedLandings[l.species] || 0) + l.weight_kg;
    });

    // Agrupar TUDO por dia para o detalhamento "Entrada e Saída"
    const dailySummary: Record<string, { landings: any[], expenses: any[] }> = {};
    
    landings.forEach(l => {
        const dateKey = new Date(l.date).toISOString().split('T')[0];
        if (!dailySummary[dateKey]) dailySummary[dateKey] = { landings: [], expenses: [] };
        
        const existing = dailySummary[dateKey].landings.find((x: any) => x.species === l.species);
        if (existing) {
            existing.weight += l.weight_kg;
        } else {
            dailySummary[dateKey].landings.push({ species: l.species, weight: l.weight_kg });
        }
    });

    expenses.forEach(e => {
        const dateKey = new Date(e.date).toISOString().split('T')[0];
        if (!dailySummary[dateKey]) dailySummary[dateKey] = { landings: [], expenses: [] };
        dailySummary[dateKey].expenses.push(e);
    });

    return {
        dailySummary: Object.entries(dailySummary)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, data]) => ({ date, ...data })),
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
    try {
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
    } catch (e: any) {
        console.error("Erro na transação de fechamento:", e);
        return { error: e.message || "Erro interno ao processar fechamento" };
    }
}
