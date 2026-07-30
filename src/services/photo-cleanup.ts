import pb from '@/lib/pocketbase/client'
import type { ItemRecord } from '@/services/items'

async function fetchPhotosAsBase64(photoUrls: string[]): Promise<string[]> {
  const results: string[] = []
  for (const url of photoUrls) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      results.push(base64)
    } catch {
      /* skip failed fetches */
    }
  }
  return results
}

export async function sendReportWithPhotos(
  inspectionId: string,
  items: ItemRecord[],
): Promise<{ success: boolean; message: string }> {
  const photosByItem: Record<string, string[]> = {}
  let totalPhotos = 0

  for (const item of items) {
    if (item.photos.length > 0) {
      const base64Photos = await fetchPhotosAsBase64(item.photos)
      if (base64Photos.length > 0) {
        photosByItem[item.id] = base64Photos
        totalPhotos += base64Photos.length
      }
    }
  }

  if (totalPhotos === 0) {
    return { success: false, message: 'Não há fotos para enviar.' }
  }

  try {
    const result = await pb.send(`/backend/v1/inspections/${inspectionId}/send-report`, {
      method: 'POST',
      body: JSON.stringify({ photos: photosByItem }),
      headers: { 'Content-Type': 'application/json' },
    })
    return { success: true, message: result.message || 'Relatório enviado com sucesso.' }
  } catch (err: any) {
    const msg = err?.response?.message || err?.message || 'Erro ao enviar relatório.'
    return { success: false, message: msg }
  }
}

export async function clearInspectionPhotos(
  inspectionId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await pb.send(`/backend/v1/inspections/${inspectionId}/clear-photos`, {
      method: 'POST',
    })
    return { success: true, message: result.message || 'Fotos removidas com sucesso.' }
  } catch (err: any) {
    const msg = err?.response?.message || err?.message || 'Erro ao limpar fotos.'
    return { success: false, message: msg }
  }
}

export function copyInspectionLink(inspectionId: string): void {
  const url = `${window.location.origin}/inspecao/${inspectionId}/relatorio`
  navigator.clipboard.writeText(url)
}
