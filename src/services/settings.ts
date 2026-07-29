import pb from '@/lib/pocketbase/client'
import { Setting } from '@/lib/types'

export async function getSetting(key: string): Promise<string> {
  try {
    const record = await pb.collection('settings').getFirstListItem(`key = "${key}"`)
    return record.getString('value') || ''
  } catch {
    return ''
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const record = await pb.collection('settings').getFirstListItem(`key = "${key}"`)
    await pb.collection('settings').update(record.id, { value })
  } catch {
    await pb.collection('settings').create({ key, value })
  }
}
