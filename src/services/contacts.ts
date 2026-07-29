import pb from '@/lib/pocketbase/client'
import { Contact } from '@/lib/types'

export async function getContacts(): Promise<Contact[]> {
  const records = await pb.collection('contacts').getFullList({ sort: 'created' })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    phone: r.phone || '',
    email: r.email || '',
    role: r.role || '',
  }))
}

export async function createContact(data: Omit<Contact, 'id'>): Promise<Contact> {
  const r = await pb.collection('contacts').create(data)
  return { id: r.id, name: r.name, phone: r.phone, email: r.email, role: r.role }
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<void> {
  await pb.collection('contacts').update(id, data)
}

export async function deleteContact(id: string): Promise<void> {
  await pb.collection('contacts').delete(id)
}
