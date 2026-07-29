import pb from '@/lib/pocketbase/client'
import { Holiday } from '@/lib/types'

export async function getHolidays(): Promise<Holiday[]> {
  const records = await pb.collection('holidays').getFullList({ sort: 'date' })
  return records.map((r: any) => ({
    id: r.id,
    date: r.date,
    name: r.name || '',
  }))
}
