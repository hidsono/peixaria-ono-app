"use server"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function registrarQuebra(batchId: string, weight_kg: number, reason: string, userId: string) {
  // @ts-ignore
  await prisma.$transaction(async (tx) => {
    // 1. Criar registro de perda
    // @ts-ignore
    await tx.spoilageLoss.create({
      data: {
        batchId,
        weight_kg,
        reason,
        createdById: userId
      }
    })

    // 2. Abater do saldo do lote
    // @ts-ignore
    const batch = await tx.inventoryBatch.findUnique({ where: { id: batchId } })
    if (!batch) throw new Error("Lote não encontrado")
    
    // @ts-ignore
    await tx.inventoryBatch.update({
      where: { id: batchId },
      data: {
        currentWeight_kg: { decrement: weight_kg }
      }
    })
  })
  
  revalidatePath('/estoque/perdas')
}
