import prisma from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const recipients = await prisma.notificationRecipient.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div>
            <h1>Configurações</h1>
            <SettingsClient initialRecipients={recipients} />
        </div>
    );
}
