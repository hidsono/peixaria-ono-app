import prisma from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const recipients = await prisma.notificationRecipient.findMany({
        orderBy: { name: 'asc' }
    });

    const fiscalConfig = await (prisma as any).globalFiscalConfig.findUnique({
        where: { id: 'global' }
    });

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Ajustes do Sistema</h1>
            <SettingsClient 
                initialRecipients={recipients} 
                initialFiscalConfig={fiscalConfig}
            />
        </div>
    );
}
