"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { notifyNewRecord } from "@/lib/notifications";

// Helper to Hash Password
function hashPassword(password: string) {
    return createHash("sha256").update(password).digest("hex");
}

// Session Helper
export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("auth_session")?.value;
    if (!sessionId) return null;

    return await prisma.user.findUnique({
        where: { id: sessionId }
    });
}

// Auth Actions
export async function login(prevState: any, formData: FormData) {
    let success = false;
    try {
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const hashedPassword = hashPassword(password);

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || user.password !== hashedPassword) {
            return { message: "Usuário ou senha inválidos." };
        }

        const cookieStore = await cookies();
        cookieStore.set("auth_session", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });
        success = true;
    } catch (e) {
        if (e instanceof Error && e.message.includes("redirect")) throw e;
        return { message: "Erro ao realizar login." };
    }

    if (success) {
        redirect("/pescadores");
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("auth_session");
    redirect("/login");
}

export async function register(prevState: any, formData: FormData) {
    let success = false;
    try {
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;

        if (!username || !password || !name) {
            return { message: "Preencha todos os campos." };
        }

        const existing = await prisma.user.findUnique({
            where: { username }
        });

        if (existing) {
            return { message: "Este nome de usuário já está em uso." };
        }

        const hashedPassword = hashPassword(password);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                role: "staff"
            }
        });

        const cookieStore = await cookies();
        cookieStore.set("auth_session", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });
        success = true;
    } catch (e) {
        if (e instanceof Error && e.message.includes("redirect")) throw e;
        return { message: "Erro ao realizar cadastro." };
    }

    if (success) {
        redirect("/pescadores");
    }
}

// Fisherman Actions
export async function getFishermen() {
    return await prisma.fisherman.findMany({
        orderBy: { name: "asc" },
        include: { createdBy: true }
    });
}


export async function createFisherman(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Acesso negado.");

    const name = formData.get("name") as string;
    const boat_name = formData.get("boat_name") as string;
    const phone = formData.get("phone") as string;
    const rgp = formData.get("rgp") as string;
    const cpf = formData.get("cpf") as string;
    const metodo = formData.get("metodo") as string;

    await prisma.fisherman.create({
        data: { name, boat_name, phone, rgp, cpf, metodo, createdById: user.id },
    });

    revalidatePath("/pescadores");
}


// Landing Actions
export async function createLanding(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Acesso negado.");

    const fishermanId = formData.get("fishermanId") as string;
    const species = formData.get("species") as string;
    const weight_kg = parseFloat(formData.get("weight_kg") as string);
    // Ajuste de fuso horário: garante que a data seja salva no meio do dia UTC
    const dateStr = formData.get("date") as string;
    const date = new Date(`${dateStr}T12:00:00Z`);

    await prisma.landing.create({
        data: { fishermanId, species, weight_kg, date, createdById: user.id },
    });

    // Notificar (ajustado para o formato da função)
    await notifyNewRecord('pescaria', { fishermanId, date, landings: [{ species, weight_kg }] });

    revalidatePath("/pescarias");
}

export async function deleteLanding(id: string) {
    await prisma.landing.delete({ where: { id } });
    revalidatePath("/pescarias");
}

export async function updateLanding(id: string, formData: FormData) {
    const species = formData.get("species") as string;
    const weight_kg = parseFloat(formData.get("weight_kg") as string);
    const dateStr = formData.get("date") as string;
    const date = new Date(`${dateStr}T12:00:00Z`);

    await prisma.landing.update({
        where: { id },
        data: { species, weight_kg, date },
    });

    revalidatePath("/pescarias");
}

// Expense Actions
export async function createExpense(formData: FormData) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Acesso negado.");

    const fishermanId = formData.get("fishermanId") as string;
    const category = formData.get("category") as string;
    const amountRaw = formData.get("amount") as string;
    const amount = amountRaw ? (parseFloat(amountRaw.replace(',', '.')) || 0) : 0;
    const quantityRaw = formData.get("quantity") as string;
    const quantity = quantityRaw ? parseFloat(quantityRaw.replace(',', '.')) : null;
    const notes = formData.get("notes") as string;
    const dateStr = formData.get("date") as string;
    const date = new Date(`${dateStr}T12:00:00Z`);

    await prisma.expense.create({
        data: { fishermanId, category, amount, quantity, notes, date, createdById: user.id },
    });

    await notifyNewRecord('despesa', { fishermanId, category, amount, quantity, notes, date });

    revalidatePath("/despesas");
}

export async function deleteExpense(id: string) {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/despesas");
}

export async function updateExpense(id: string, formData: FormData) {
    const category = formData.get("category") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const notes = formData.get("notes") as string;
    const dateStr = formData.get("date") as string;
    const date = new Date(`${dateStr}T12:00:00Z`);

    await prisma.expense.update({
        where: { id },
        data: { category, amount, notes, date },
    });

    revalidatePath("/despesas");
}

// Unified Ticket Action
export async function createUnifiedTicket(data: {
    fishermanId: string;
    date: string;
    landings: { species: string; weight_kg: number }[];
    expenses: { category: string; amount: number; quantity?: number; notes?: string }[];
}) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Acesso negado.");

    const { fishermanId, date, landings, expenses } = data;
    const ticketDate = new Date(`${date}T12:00:00Z`);

    await prisma.$transaction(async (tx) => {
        for (const l of landings) {
            await tx.landing.create({
                data: {
                    fishermanId,
                    species: l.species,
                    weight_kg: l.weight_kg,
                    date: ticketDate,
                    createdById: user.id
                }
            });
        }
        for (const e of expenses) {
            await tx.expense.create({
                data: {
                    fishermanId,
                    category: e.category,
                    amount: e.amount,
                    quantity: e.quantity,
                    notes: e.notes,
                    date: ticketDate,
                    createdById: user.id
                }
            });
        }
    });

    await notifyNewRecord('pescaria', data);

    revalidatePath("/pescarias");
    revalidatePath("/despesas");
    revalidatePath("/fechamentos");

    return { success: true };
}

// Species Suggestions
export async function getSpeciesSuggestions() {
    const species = await prisma.landing.findMany({
        select: { species: true },
        distinct: ['species'],
        orderBy: { species: 'asc' }
    });
    return species.map(s => s.species);
}

// Temporary: First user creation helper (only for setup)
export async function createFirstUser() {
    const existing = await prisma.user.count();
    if (existing > 0) return;

    await prisma.user.create({
        data: {
            username: "admin",
            password: hashPassword("admin123"),
            name: "Administrador"
        }
    });
}

