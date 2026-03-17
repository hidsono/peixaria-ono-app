import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const saleId = searchParams.get('saleId')

  if (!saleId) {
    return NextResponse.json({ error: 'saleId is required' }, { status: 400 })
  }

  const fiscalEvents = await (prisma as any).fiscalEvent.findMany({
    where: { saleId },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({ fiscalEvents })
}
