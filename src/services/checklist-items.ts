import pb from '@/lib/pocketbase/client'
import { ChecklistItem } from '@/lib/types'

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  const records = await pb.collection('checklist_items').getFullList({ sort: 'created' })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    active: r.active ?? true,
    mandatory: r.mandatory ?? true,
  }))
}

export async function createChecklistItem(data: Omit<ChecklistItem, 'id'>): Promise<ChecklistItem> {
  const r = await pb.collection('checklist_items').create({
    name: data.name,
    active: data.active,
    mandatory: data.mandatory,
  })
  return { id: r.id, name: r.name, active: r.active, mandatory: r.mandatory }
}

export async function updateChecklistItem(id: string, data: Partial<ChecklistItem>): Promise<void> {
  await pb.collection('checklist_items').update(id, {
    name: data.name,
    active: data.active,
    mandatory: data.mandatory,
  })
}

export async function deleteChecklistItem(id: string): Promise<void> {
  await pb.collection('checklist_items').delete(id)
}
