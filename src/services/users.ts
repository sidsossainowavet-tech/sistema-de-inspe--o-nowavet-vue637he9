import pb from '@/lib/pocketbase/client'
import { UserAccount } from '@/lib/types'

function getFileUrl(record: any, filename: string): string {
  if (!filename) return ''
  try {
    return pb.getFileUrl(record, filename) as unknown as string
  } catch {
    return ''
  }
}

export async function getUsers(): Promise<UserAccount[]> {
  const records = await pb.collection('users').getFullList({ sort: 'created' })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    role: r.role || 'evaluator',
    active: r.active !== false,
    avatar: getFileUrl(r, r.avatar),
  }))
}

export async function createUser(data: {
  name: string
  email: string
  role: string
  active: boolean
  password: string
}): Promise<UserAccount> {
  const r = await pb.collection('users').create({
    email: data.email,
    name: data.name,
    role: data.role,
    active: data.active !== false,
    password: data.password,
    passwordConfirm: data.password,
  })
  return { id: r.id, name: r.name, email: r.email, role: r.role, active: r.active }
}

export async function updateUser(
  id: string,
  data: {
    name?: string
    email?: string
    role?: string
    active?: boolean
    password?: string
  },
): Promise<void> {
  const updateData: Record<string, any> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.role !== undefined) updateData.role = data.role
  if (data.active !== undefined) updateData.active = data.active
  if (data.password) {
    updateData.password = data.password
    updateData.passwordConfirm = data.password
  }
  await pb.collection('users').update(id, updateData)
}
