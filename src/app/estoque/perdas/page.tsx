import { getInventoryBatches } from '@/app/actions/inventory-actions'
import QuebraClient from './QuebraClient'

export const dynamic = 'force-dynamic'

export default async function QuebraPage() {
  const batches = await getInventoryBatches()
  
  return <QuebraClient initialBatches={batches} />
}
