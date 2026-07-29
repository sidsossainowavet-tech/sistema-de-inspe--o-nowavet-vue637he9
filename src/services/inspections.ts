import pb from '@/lib/pocketbase/client'
import { Inspection } from '@/lib/types'

function getFileUrl(record: any, filename: string): string {
  if (!filename) return ''
  try {
    return pb.getFileUrl(record, filename) as unknown as string
  } catch {
    return ''
  }
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

function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i)
  return new File([u8arr], filename, { type: mime })
}

export async function createInspection(inspection: Inspection): Promise<Inspection> {
  const photos: File[] = []
  const cleanAnswers = inspection.answers.map((a) => {
    if (a.photo && a.photo.startsWith('data:')) {
      photos.push(dataURLtoFile(a.photo, `item-${a.itemId}.jpg`))
      return { ...a, photo: '' }
    }
    return a
  })

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

  let record
  if (photos.length > 0) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    }
    photos.forEach((p) => formData.append('photos', p))
    record = await pb.collection('inspections').create(formData)
  } else {
    record = await pb.collection('inspections').create(data)
  }
  return mapInspection(record)
}

export async function deleteInspection(id: string): Promise<void> {
  await pb.collection('inspections').delete(id)
}
