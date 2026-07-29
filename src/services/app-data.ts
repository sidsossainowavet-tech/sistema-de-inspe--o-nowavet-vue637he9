import pb from '@/lib/pocketbase/client'
import type {
  ChecklistItem,
  Contact,
  Facility,
  Evaluator,
  Inspection,
  UserAccount,
} from '@/lib/types'

function getFileUrl(record: any, filename: string): string {
  if (!filename) return ''
  try {
    return pb.getFileUrl(record, filename) as unknown as string
  } catch {
    return ''
  }
}

export async function getAppData() {
  const [items, facilities, evaluators, contacts, users, inspections] = await Promise.all([
    pb.collection('checklist_items').getFullList({ sort: 'created' }),
    pb.collection('facilities').getFullList({ sort: 'created' }),
    pb.collection('evaluators').getFullList({ sort: 'created' }),
    pb.collection('contacts').getFullList({ sort: 'created' }),
    pb.collection('users').getFullList({ sort: 'created' }),
    pb.collection('inspections').getFullList({ sort: '-date' }),
  ])

  return {
    items: items.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      active: r.active !== false,
      mandatory: r.mandatory !== false,
    })) as ChecklistItem[],
    facilities: facilities.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      description: r.description || '',
      frequencyDays: r.frequency_days || undefined,
      category: r.category || undefined,
    })) as Facility[],
    evaluators: evaluators.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      phone: r.phone || '',
      avatar: getFileUrl(r, r.avatar),
    })) as Evaluator[],
    contacts: contacts.map((r: any) => ({
      id: r.id,
      sector: r.role || r.name || '',
      email: r.email || '',
      phone: r.phone || '',
    })) as Contact[],
    users: users.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      email: r.email || '',
      role: r.role || 'evaluator',
      active: r.active !== false,
      avatar: getFileUrl(r, r.avatar),
    })) as UserAccount[],
    inspections: inspections.map((r: any) => ({
      id: r.id,
      facilityId: r.facility_id || undefined,
      evaluatorId: r.evaluator_id || undefined,
      structure: r.structure || '',
      type: r.type === 'Check-out' ? 'Check-out' : 'Check-in',
      answers: Array.isArray(r.answers) ? r.answers : [],
      date: r.date || new Date().toISOString(),
      startTime: r.start_time || undefined,
      endTime: r.end_time || undefined,
      durationSeconds: r.duration_seconds || undefined,
      isSynced: true,
      inspector: r.inspector || '',
    })) as Inspection[],
  }
}
