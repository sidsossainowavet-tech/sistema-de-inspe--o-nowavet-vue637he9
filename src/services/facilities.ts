import pb from '@/lib/pocketbase/client'
import { Facility } from '@/lib/types'

export async function getFacilities(): Promise<Facility[]> {
  const records = await pb.collection('facilities').getFullList({ sort: 'created' })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    description: r.description || '',
    address: r.address || '',
    city: r.city || '',
    state: r.state || '',
    contactId: r.contact_id || undefined,
    frequencyDays: r.frequency_days || undefined,
    category: r.category || undefined,
  }))
}

export async function createFacility(data: Partial<Facility>): Promise<Facility> {
  const r = await pb.collection('facilities').create({
    name: data.name,
    description: data.description || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    contact_id: data.contactId || null,
    frequency_days: data.frequencyDays || null,
    category: data.category || '',
  })
  return {
    id: r.id,
    name: r.name,
    description: r.description || '',
    address: r.address || '',
    city: r.city || '',
    state: r.state || '',
    contactId: r.contact_id || undefined,
    frequencyDays: r.frequency_days || undefined,
    category: r.category || undefined,
  }
}

export async function updateFacility(id: string, data: Partial<Facility>): Promise<void> {
  await pb.collection('facilities').update(id, {
    name: data.name,
    description: data.description || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    contact_id: data.contactId || null,
    frequency_days: data.frequencyDays || null,
    category: data.category || '',
  })
}

export async function deleteFacility(id: string): Promise<void> {
  await pb.collection('facilities').delete(id)
}
