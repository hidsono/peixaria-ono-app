export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { createExpense } from "../actions";
import ExpenseItem from "./ExpenseItem";
import ExpenseForm from "./ExpenseForm";

export default async function Despesas() {
    const fishermen = await prisma.fisherman.findMany({ orderBy: { name: 'asc' } });
    const recentExpenses = await prisma.expense.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { fisherman: true }
    });

    return (
        <div>
            <div className="no-print">
                <h1>Registro de Despesas</h1>
            </div>

            <ExpenseForm fishermen={fishermen} />


            <div className="no-print">
                <h2>Últimas Despesas</h2>
                {recentExpenses.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma despesa registrada.</p>
                ) : (
                    recentExpenses.map((e) => (
                        <ExpenseItem key={e.id} expense={e} />
                    ))
                )}
            </div>
        </div>
    );
}
