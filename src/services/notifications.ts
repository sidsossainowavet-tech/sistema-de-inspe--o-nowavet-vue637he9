import pb from '@/lib/pocketbase/client'
import { Notification } from '@/lib/types'

function mapNotification(r: any): Notification {
  return {
    id: r.id,
    userId: r.user_id || '',
    facilityId: r.facility_id || '',
    type: r.type || 'missed_inspection',
    message: r.message || '',
    read: r.read || false,
    created: r.created || '',
  }
}

export async function getNotifications(): Promise<Notification[]> {
  const records = await pb.collection('notifications').getFullList({ sort: '-created' })
  return records.map(mapNotification)
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await pb.collection('notifications').update(id, { read: true })
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const records = await pb.collection('notifications').getFullList({ filter: 'read = false' })
  await Promise.all(records.map((r) => pb.collection('notifications').update(r.id, { read: true })))
}

export async function getUnreadCount(): Promise<number> {
  const result = await pb.collection('notifications').getList(1, 1, { filter: 'read = false' })
  return result.totalItems
}
