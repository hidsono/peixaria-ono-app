"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addRecipient(formData: FormData) {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    try {
        return await prisma.notificationRecipient.create({
            data: { name, phone }
        });
    } catch (e: any) {
        if (e.code === 'P2002') return { error: "Este número já está cadastrado." };
        throw e;
    } finally {
        revalidatePath("/configuracoes");
    }
}

export async function toggleRecipient(id: string) {
    const recipient = await prisma.notificationRecipient.findUnique({ where: { id } });
    if (!recipient) return;

    await prisma.notificationRecipient.update({
        where: { id },
        data: { active: !recipient.active }
    });
    revalidatePath("/configuracoes");
}

export async function removeRecipient(id: string) {
    await prisma.notificationRecipient.delete({ where: { id } });
    revalidatePath("/configuracoes");
}
