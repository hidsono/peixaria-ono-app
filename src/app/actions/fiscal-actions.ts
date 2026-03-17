"use server"

import prisma from '@/lib/prisma'
// import { TipoPropriedade, StatusFiscal } from '@prisma/client'
import { inngest } from '@/lib/inngest'

type CartItem = {
  batchId: string;
  weight_kg: number;
  pricePerKg: number;
  propertyType: any;
  fishermanId?: string | null;
}

export async function checkoutMistoPDV(cartItems: CartItem[], totalAmount: number, customerCpf?: string) {
  // 1. Limite da NFC-e sem CPF em SP
  if (!customerCpf && totalAmount > 10000) {
    throw new Error('Vendas acima de R$ 10.000,00 obrigam identificação (CPF/CNPJ).')
  }

  // 2. Garantir que os Lotes Mocks existam fisicamente no banco de dados para a Foreign Key (simulação)
  for (const item of cartItems) {
    
    // Se for de terceiros, garante que o dono/pescador (Pessoa Física) exista na tabela Pescador primeiro (Foreign Key Restraint)
    if (item.propertyType === 'TERCEIROS' && item.fishermanId) {
       await (prisma as any).fisherman.upsert({
         where: { id: item.fishermanId },
         update: {},
         create: {
           id: item.fishermanId,
           name: 'Pescador Simulado (Mock)',
         }
       })
    }
  
    await (prisma as any).inventoryBatch.upsert({
      where: { id: item.batchId },
      update: {},
      create: {
        id: item.batchId,
        species: 'Peixe Simulado',
        initialWeight_kg: 100,
        currentWeight_kg: 99,
        propertyType: item.propertyType,
        fishermanId: item.fishermanId || undefined,
      }
    })
  }

  // 3. Criar a Venda Root (Sale)
  const sale = await (prisma as any).sale.create({
    data: {
      totalAmount,
      customerCpf,
      items: {
        create: cartItems.map(item => ({
          batchId: item.batchId,
          weight_kg: item.weight_kg,
          pricePerKg: item.pricePerKg,
          subtotal: item.weight_kg * item.pricePerKg
        }))
      }
    }
  })

  // 3. Lógica de Agrupamento / Split (Próprio vs Terceiros)
  const eventosFiscais = []

  // Itens da Peixaria Ono (CFOP 5.102)
  const itensProprios = cartItems.filter(item => item.propertyType === 'PROPRIO')
  if (itensProprios.length > 0) {
    eventosFiscais.push({
      saleId: sale.id,
      eventType: 'VENDA_PROPRIO',
      cfop: '5.102',
      status: 'PENDENTE'
    })
  }

  // Itens de Repasse (Terceiros): precisa agrupar por Pescador
  const itensTerceiros = cartItems.filter(item => item.propertyType === 'TERCEIROS')
  
  // Agrupar itens pelo pescador dono para emitir notas conjuntas
  const pescadoresIds = [...new Set(itensTerceiros.map(i => i.fishermanId).filter(Boolean))]

  for (const pId of pescadoresIds) {
    // 1º Passo do Pescador: Venda para o Consumidor (Emitida pelo Pescador)
    eventosFiscais.push({
      saleId: sale.id,
      fishermanId: pId,
      eventType: 'VENDA_TERCEIROS',
      cfop: '5.102',
      status: 'PENDENTE'
    })

    // 2º Passo: Retorno de Depósito (Peixaria -> Pescador)
    eventosFiscais.push({
      saleId: sale.id,
      fishermanId: pId,
      eventType: 'RETORNO_DEPOSITO',
      cfop: '5.906',
      status: 'PENDENTE'
    })
  }

  // 4. Persistindo Eventos
  await (prisma as any).fiscalEvent.createMany({
    data: eventosFiscais
  })

  // 5. Acionar a Fila Assíncrona do Inngest
  await inngest.send({
    name: "fiscal/processar.venda" as any,
    data: {
      saleId: sale.id,
    },
  });

  return { success: true, trackingSaleId: sale.id }
}
