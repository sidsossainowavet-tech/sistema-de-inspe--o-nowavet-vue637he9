import pb from '@/lib/pocketbase/client'
import { Evaluator } from '@/lib/types'

function getFileUrl(record: any, filename: string): string {
  if (!filename) return ''
  try {
    return pb.getFileUrl(record, filename) as unknown as string
  } catch {
    return ''
  }
}

export async function getEvaluators(): Promise<Evaluator[]> {
  const records = await pb.collection('evaluators').getFullList({ sort: 'created' })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    avatar: getFileUrl(r, r.avatar),
  }))
}

export async function createEvaluator(data: Partial<Evaluator>): Promise<Evaluator> {
  const r = await pb.collection('evaluators').create({
    name: data.name,
    email: data.email || '',
    phone: data.phone || '',
  })
  return { id: r.id, name: r.name, email: r.email, phone: r.phone, avatar: '' }
}

export async function updateEvaluator(id: string, data: Partial<Evaluator>): Promise<void> {
  await pb.collection('evaluators').update(id, {
    name: data.name,
    email: data.email,
    phone: data.phone,
  })
}

export async function deleteEvaluator(id: string): Promise<void> {
  await pb.collection('evaluators').delete(id)
}
