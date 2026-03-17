import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Buscamos apenas lotes que tenham peso disponível
  const batches = await prisma.inventoryBatch.findMany({
    where: {
      currentWeight_kg: { gt: 0 }
    },
    include: {
      fisherman: true,
      product: true
    },
    orderBy: { createdAt: 'desc' }
  })
  
  // Formatamos para o padrão que o PDV espera
  const catalog = batches.map(batch => {
    const isProprio = batch.propertyType === 'PROPRIO';
    
    // Cores aleatórias baseadas na espécie para o visual premium do PDV
    const colorSchemes = [
      'from-orange-400 to-rose-500',
      'from-blue-200 to-blue-400',
      'from-emerald-400 to-teal-500',
      'from-rose-400 to-pink-500',
      'from-slate-300 to-slate-500',
      'from-purple-400 to-indigo-500'
    ];
    
    const colorIndex = Math.abs(batch.species.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colorSchemes.length;

    return {
      id: batch.id,
      name: batch.species,
      price: batch.product?.defaultPrice || batch.defaultPrice || 0,
      category: isProprio ? 'Próprio' : 'Parceiros',
      owner: isProprio ? 'Peixaria Ono' : (batch.fisherman?.name || 'Desconhecido'),
      propertyType: batch.propertyType,
      stock: batch.currentWeight_kg,
      fishermanId: batch.fishermanId,
      color: colorSchemes[colorIndex],
      ncm: batch.product?.ncm || null,
      barcode: batch.barcode || batch.product?.barcode || null
    };
  });
  
  return NextResponse.json({ batches: catalog })
}
