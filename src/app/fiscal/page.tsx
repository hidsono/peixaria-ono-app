import prisma from "@/lib/prisma";
import FiscalPanelClient from "./FiscalPanelClient";

export const dynamic = 'force-dynamic';

export default async function FiscalPanel() {
  const events = await (prisma as any).fiscalEvent.findMany({
    include: {
      sale: true,
      fisherman: true,
      inventoryBatch: {
        include: { fisherman: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  }) as any[];

  return <FiscalPanelClient initialEvents={events} />;
}
