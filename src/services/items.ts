import pb from '@/lib/pocketbase/client'

export interface ItemRecord {
  id: string
  name: string
  status: string
  notes: string
  observations: string
  photos: string[]
}

function getFileUrl(record: any, filename: string): string {
  if (!filename) return ''
  try {
    return pb.getFileUrl(record, filename) as unknown as string
  } catch {
    return ''
  }
}

export async function getItemsByInspection(inspectionId: string): Promise<ItemRecord[]> {
  const records = await pb.collection('items').getFullList({
    filter: `inspection_id = "${inspectionId}"`,
    sort: 'created',
  })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    status: r.status || '',
    notes: r.notes || '',
    observations: r.observations || '',
    photos: (r.photos || []).map((f: string) => getFileUrl(r, f)),
  }))
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

function urlToFilename(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1] || ''
}

export async function createItem(
  inspectionId: string,
  data: {
    name: string
    status: string
    notes?: string
    observations?: string
    photos?: string[]
  },
): Promise<void> {
  const formData = new FormData()
  formData.append('inspection_id', inspectionId)
  formData.append('name', data.name)
  formData.append('status', data.status)
  if (data.notes) formData.append('notes', data.notes)
  if (data.observations) formData.append('observations', data.observations)

  if (data.photos) {
    data.photos.forEach((photo, i) => {
      if (photo.startsWith('data:')) {
        formData.append('photos', dataURLtoFile(photo, `photo-${i}.jpg`))
      } else {
        formData.append('photos', urlToFilename(photo))
      }
    })
  }
  await pb.collection('items').create(formData)
}

export async function deleteItemsByInspection(inspectionId: string): Promise<void> {
  const records = await pb.collection('items').getFullList({
    filter: `inspection_id = "${inspectionId}"`,
  })
  for (const r of records) {
    await pb.collection('items').delete(r.id)
  }
}
