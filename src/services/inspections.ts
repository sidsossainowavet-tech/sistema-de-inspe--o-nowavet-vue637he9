import pb from '@/lib/pocketbase/client'
import { Inspection } from '@/lib/types'
import { createItem, deleteItemsByInspection } from '@/services/items'

const STATUS_MAP: Record<string, string> = {
  C: 'approved',
  NC: 'disapproved',
  NA: 'needs_review',
}

function mapInspection(r: any): Inspection {
  let answers = r.answers
  if (typeof answers === 'string') {
    try {
      answers = JSON.parse(answers)
    } catch {
      answers = []
    }
  }
  if (!Array.isArray(answers)) answers = []

  return {
    id: r.id,
    facilityId: r.facility_id || undefined,
    evaluatorId: r.evaluator_id || undefined,
    structure: r.structure || '',
    type: r.type || 'Check-in',
    answers,
    date: r.date || new Date().toISOString(),
    startTime: r.start_time || undefined,
    endTime: r.end_time || undefined,
    durationSeconds: r.duration_seconds || undefined,
    isSynced: true,
    inspector: r.inspector || '',
  }
}

export async function getInspections(): Promise<Inspection[]> {
  const records = await pb.collection('inspections').getFullList({ sort: '-date' })
  return records.map(mapInspection)
}

export async function getInspection(id: string): Promise<Inspection> {
  const r = await pb.collection('inspections').getOne(id)
  return mapInspection(r)
}

export async function createInspection(inspection: Inspection): Promise<Inspection> {
  const cleanAnswers = inspection.answers.map((a) => ({
    itemId: a.itemId,
    itemName: a.itemName,
    status: a.status,
    justification: a.justification,
    observations: a.observations,
  }))

  const data: Record<string, any> = {
    facility_id: inspection.facilityId || '',
    evaluator_id: inspection.evaluatorId || '',
    date: inspection.date,
    status: 'completed',
    type: inspection.type,
    structure: inspection.structure,
    inspector: inspection.inspector,
    start_time: inspection.startTime || '',
    end_time: inspection.endTime || '',
    duration_seconds: inspection.durationSeconds || 0,
    answers: cleanAnswers,
    notes: '',
  }

  const record = await pb.collection('inspections').create(data)

  for (const answer of inspection.answers) {
    if (!answer.status) continue
    try {
      await createItem(record.id, {
        name: answer.itemName || answer.itemId,
        status: STATUS_MAP[answer.status] || 'needs_review',
        notes: answer.justification || '',
        observations: answer.observations || '',
        photos: answer.photos,
      })
    } catch (err) {
      console.error('Failed to create item:', err)
    }
  }

  return mapInspection(record)
}

export async function updateInspection(id: string, inspection: Inspection): Promise<Inspection> {
  const cleanAnswers = inspection.answers.map((a) => ({
    itemId: a.itemId,
    itemName: a.itemName,
    status: a.status,
    justification: a.justification,
    observations: a.observations,
  }))

  const data: Record<string, any> = {
    facility_id: inspection.facilityId || '',
    evaluator_id: inspection.evaluatorId || '',
    date: inspection.date,
    status: 'completed',
    type: inspection.type,
    structure: inspection.structure,
    inspector: inspection.inspector,
    start_time: inspection.startTime || '',
    end_time: inspection.endTime || '',
    duration_seconds: inspection.durationSeconds || 0,
    answers: cleanAnswers,
    notes: '',
  }

  await pb.collection('inspections').update(id, data)
  await deleteItemsByInspection(id)

  for (const answer of inspection.answers) {
    if (!answer.status) continue
    try {
      await createItem(id, {
        name: answer.itemName || answer.itemId,
        status: STATUS_MAP[answer.status] || 'needs_review',
        notes: answer.justification || '',
        observations: answer.observations || '',
        photos: answer.photos,
      })
    } catch (err) {
      console.error('Failed to create item:', err)
    }
  }

  const record = await pb.collection('inspections').getOne(id)
  return mapInspection(record)
}

export async function deleteInspection(id: string): Promise<void> {
  await deleteItemsByInspection(id)
  await pb.collection('inspections').delete(id)
}
