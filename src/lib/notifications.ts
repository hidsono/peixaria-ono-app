import prisma from "./prisma";

export async function notifyNewRecord(type: 'pescaria' | 'despesa', details: any) {
    try {
        const recipients = await prisma.notificationRecipient.findMany({
            where: { active: true }
        });

        if (recipients.length === 0) return;

        let message = "";
        if (type === 'pescaria') {
            const fisherman = await prisma.fisherman.findUnique({ where: { id: details.fishermanId } });
            message = `📌 *Nova Pescaria Registrada*\n\n` +
                      `👤 *Pescador:* ${fisherman?.name || 'Não identificado'}\n` +
                      `⛵ *Barco:* ${fisherman?.boat_name || '-'}\n` +
                      `🐟 *Entradas:* ${details.landings.map((l: any) => `\n   - ${l.species}: ${l.weight_kg}kg`).join('')}\n` +
                      `📅 *Data:* ${new Date(details.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
            
            if (details.expenses && details.expenses.length > 0) {
                message += `\n\n💸 *Despesas:* ${details.expenses.map((e: any) => `\n   - ${e.category}: R$ ${e.amount.toFixed(2)}${e.quantity ? ` (${e.quantity}kg)` : ''}`).join('')}`;
            }
        } else {
             // Individual expense notification logic if needed
             const fisherman = await prisma.fisherman.findUnique({ where: { id: details.fishermanId } });
             message = `💸 *Nova Despesa Registrada*\n\n` +
                       `👤 *Pescador:* ${fisherman?.name || '-'}\n` +
                       `📁 *Categoria:* ${details.category}\n` +
                       `💰 *Valor:* R$ ${details.amount.toFixed(2)}\n` +
                       (details.quantity ? `⚖️ *Qtd:* ${details.quantity}kg\n` : '') +
                       (details.notes ? `📝 *Obs:* ${details.notes}\n` : '') +
                       `📅 *Data:* ${new Date(details.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
        }

        console.log("NOTIFICAÇÃO PARA ENVIAR:", message);

        // Integração via Webhook (ex: Evolution API, Zapier, etc)
        const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
        if (webhookUrl) {
            for (const r of recipients) {
                try {
                    await fetch(webhookUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            phone: r.phone, 
                            message: message,
                            name: r.name
                        })
                    });
                } catch (err) {
                    console.error(`Erro ao enviar webhook para ${r.phone}:`, err);
                }
            }
        }
        
        return true;
    } catch (e) {
        console.error("Erro ao processar notificação:", e);
        return false;
    }
}
