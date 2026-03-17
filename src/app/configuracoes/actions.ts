"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest";

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

export async function saveGlobalFiscalConfig(data: {
    companyName: string;
    cnpj: string;
    focusToken?: string;
    environment: string;
    certBase64?: string;
    certPassword?: string;
    certValidUntil?: string;
}) {
    await (prisma as any).globalFiscalConfig.upsert({
        where: { id: 'global' },
        update: {
            companyName: data.companyName,
            cnpj: data.cnpj,
            focusToken: data.focusToken,
            environment: data.environment,
            certBase64: data.certBase64,
            certPassword: data.certPassword,
            certValidUntil: data.certValidUntil ? new Date(data.certValidUntil) : null
        },
        create: {
            id: 'global',
            companyName: data.companyName,
            cnpj: data.cnpj,
            focusToken: data.focusToken,
            environment: data.environment,
            certBase64: data.certBase64,
            certPassword: data.certPassword,
            certValidUntil: data.certValidUntil ? new Date(data.certValidUntil) : null
        }
    });
    revalidatePath("/configuracoes");
}

export async function testFocusConnection(token: string, environment: string) {
    const baseUrl = environment === 'producao' 
        ? "https://api.focusnfe.com.br/v2" 
        : "https://homologacao.focusnfe.com.br/v2";

    try {
        const response = await fetch(`${baseUrl}/hooks`, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${Buffer.from(token + ":").toString("base64")}`
            }
        });

        if (response.status === 200) {
            return { success: true, message: "Conexão estabelecida com sucesso!" };
        } else {
            const data = await response.json();
            return { success: false, message: data.mensagem || "Erro ao conectar. Verifique o token." };
        }
    } catch (error) {
        return { success: false, message: "Falha na comunicação com o servidor da FocusNFe." };
    }
}

export async function clearPendingFiscalEvents() {
    await (prisma as any).fiscalEvent.deleteMany({
        where: { status: 'PENDENTE' }
    });
    revalidatePath("/fiscal");
    return { success: true };
}

export async function transmitFiscalEvent(eventId: string) {
    try {
        // Altera o status para PROCESSANDO. O Fiscal-Worker do Inngest 
        // deve estar ouvindo mudanças ou ser disparado manualmente.
        await (prisma as any).fiscalEvent.update({
            where: { id: eventId },
            data: { status: 'PROCESSANDO' }
        });

        // Dispara o evento de processamento para o Inngest
        const event = await (prisma as any).fiscalEvent.findUnique({
            where: { id: eventId }
        });

        if (event?.saleId) {
            await inngest.send({
                name: "fiscal/processar.venda" as any,
                data: { saleId: event.saleId },
            });
        }

        revalidatePath("/fiscal");
        return { success: true };
    } catch (error) {
        console.error("Erro ao transmitir evento fiscal:", error);
        return { success: false, message: "Erro ao tentar transmitir." };
    }
}
