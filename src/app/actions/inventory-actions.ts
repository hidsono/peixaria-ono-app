"use server"
import prisma from '@/lib/prisma'
// import { StatusFiscal } from '@prisma/client'

export async function registrarQuebra(batchId: string, weight_kg: number, reason: string, userId: string) {
  // 1. Localiza o lote
  const batch = await (prisma as any).inventoryBatch.findUnique({
    where: { id: batchId }
  })

  if (!batch) throw new Error("Lote não encontrado.");

  // 2. Registra a perda e abate o saldo do estoque
  await (prisma as any).$transaction([
    (prisma as any).spoilageLoss.create({
      data: {
        batchId,
        weight_kg,
        reason,
        createdById: userId
      }
    }),
    (prisma as any).inventoryBatch.update({
      where: { id: batchId },
      data: {
        currentWeight_kg: { decrement: weight_kg }
      }
    })
  ])

  // 3. REGRA DE NEGÓCIO CRÍTICA: Se for TERCEIROS, dispara o retorno fiscal simbólico
  if (batch.propertyType === 'TERCEIROS') {
    await (prisma as any).fiscalEvent.create({
      data: {
        batchId: batch.id,
        fishermanId: batch.fishermanId,
        eventType: 'RETORNO_DEPOSITO',
        cfop: '5.906', // Retorno Simbólico
        status: 'PENDENTE'
      }
    })
  }

  return { success: true }
}

export async function simularAprovaçãoEntrada(batchId: string) {
  await (prisma as any).fiscalEvent.updateMany({
    where: { batchId },
    data: { 
      status: 'AUTORIZADA',
      nfeKey: "352402111111111111115500100000000998765432"
    }
  })
  return { success: true }
}

export async function simularAprovaçãoSefaz(saleId: string) {
  await (prisma as any).fiscalEvent.updateMany({
    where: { saleId },
    data: { 
      status: 'AUTORIZADA',
      nfeKey: "352402111111111111116500100000000512345678"
    }
  })
  return { success: true }
}

export async function getInventoryBatches() {
  return await (prisma as any).inventoryBatch.findMany({
    where: {
      currentWeight_kg: { gt: 0 }
    },
    include: {
      fisherman: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}
