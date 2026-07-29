import pb from '@/lib/pocketbase/client'
import { ChecklistItem, Contact, Facility, Evaluator, Inspection, UserAccount } from './types'
import { defaultItems, defaultFacilities, defaultEvaluators, defaultContacts } from './defaults'

export const isSupabaseConfigured = true

function getFileUrl(record: any, filename: string): string {
  if (!filename) return ''
  try {
    return pb.getFileUrl(record, filename) as unknown as string
  } catch {
    return ''
  }
}

function mapChecklistItem(r: any): ChecklistItem {
  return { id: r.id, name: r.name, active: r.active ?? true, mandatory: r.mandatory ?? true }
}
function mapFacility(r: any): Facility {
  return {
    id: r.id,
    name: r.name,
    description: r.description || '',
    frequencyDays: r.frequency_days || undefined,
    category: r.category || undefined,
  }
}
function mapEvaluator(r: any): Evaluator {
  return {
    id: r.id,
    name: r.name,
    email: r.email || '',
    phone: r.phone || '',
    avatar: getFileUrl(r, r.avatar),
  }
}
function mapContact(r: any): Contact {
  return {
    id: r.id,
    name: r.name || '',
    phone: r.phone || '',
    email: r.email || '',
    role: r.role || '',
  }
}
function mapUser(r: any): UserAccount {
  return {
    id: r.id,
    name: r.name || '',
    email: r.email || '',
    role: r.role || 'evaluator',
    active: r.active !== false,
    avatar: getFileUrl(r, r.avatar),
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

export const api = {
  verifyUser: async (email: string): Promise<UserAccount> => {
    const record = await pb
      .collection('users')
      .getFirstListItem(pb.filter('email = {:email}', { email }))
    return mapUser(record)
  },

  getAppData: async () => {
    const [itemsR, facR, evalR, conR, inspR] = await Promise.all([
      pb
        .collection('checklist_items')
        .getFullList({ sort: 'created' })
        .catch(() => []),
      pb
        .collection('facilities')
        .getFullList({ sort: 'created' })
        .catch(() => []),
      pb
        .collection('evaluators')
        .getFullList({ sort: 'created' })
        .catch(() => []),
      pb
        .collection('contacts')
        .getFullList({ sort: 'created' })
        .catch(() => []),
      pb
        .collection('inspections')
        .getFullList({ sort: '-date' })
        .catch(() => []),
    ])
    const usersR = await pb
      .collection('users')
      .getFullList({ sort: 'created' })
      .catch(() => [])
    return {
      items: itemsR.length ? itemsR.map(mapChecklistItem) : defaultItems,
      facilities: facR.length ? facR.map(mapFacility) : defaultFacilities,
      evaluators: evalR.length ? evalR.map(mapEvaluator) : defaultEvaluators,
      contacts: conR.length ? conR.map(mapContact) : defaultContacts,
      users: usersR.map(mapUser),
      inspections: inspR.map(mapInspection),
    }
  },

  manageUser: async (
    action: 'create' | 'update' | 'update_status',
    userData: any,
    password?: string,
  ) => {
    if (action === 'create') {
      await pb.collection('users').create({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        active: userData.active !== false,
        password,
        passwordConfirm: password,
      })
    } else if (action === 'update') {
      const data: any = { email: userData.email, name: userData.name, role: userData.role }
      if (password) {
        data.password = password
        data.passwordConfirm = password
      }
      await pb.collection('users').update(userData.id, data)
    } else if (action === 'update_status') {
      await pb.collection('users').update(userData.id, { active: userData.active })
    }
    return { success: true }
  },

  saveUsers: async (users: UserAccount[]) => {
    for (const u of users) {
      try {
        await pb
          .collection('users')
          .update(u.id, { name: u.name, email: u.email, role: u.role, active: u.active })
      } catch {
        /* skip */
      }
    }
  },

  saveItems: async (items: ChecklistItem[]) => {
    for (const item of items) {
      try {
        await pb.collection('checklist_items').update(item.id, {
          name: item.name,
          active: item.active,
          mandatory: item.mandatory ?? true,
        })
      } catch {
        try {
          await pb
            .collection('checklist_items')
            .create({ name: item.name, active: item.active, mandatory: item.mandatory ?? true })
        } catch (e) {
          console.error('Error saving item:', e)
        }
      }
    }
  },

  saveFacilities: async (facilities: Facility[]) => {
    for (const f of facilities) {
      try {
        await pb.collection('facilities').update(f.id, {
          name: f.name,
          description: f.description,
          frequency_days: f.frequencyDays || null,
          category: f.category || '',
        })
      } catch {
        try {
          await pb.collection('facilities').create({
            name: f.name,
            description: f.description,
            frequency_days: f.frequencyDays || null,
            category: f.category || '',
          })
        } catch (e) {
          console.error('Error saving facility:', e)
        }
      }
    }
  },

  saveEvaluators: async (evaluators: Evaluator[]) => {
    for (const e of evaluators) {
      try {
        await pb
          .collection('evaluators')
          .update(e.id, { name: e.name, email: e.email, phone: e.phone })
      } catch {
        try {
          await pb.collection('evaluators').create({ name: e.name, email: e.email, phone: e.phone })
        } catch (err) {
          console.error('Error saving evaluator:', err)
        }
      }
    }
  },

  saveContacts: async (contacts: Contact[]) => {
    for (const c of contacts) {
      try {
        await pb
          .collection('contacts')
          .update(c.id, { name: c.name, phone: c.phone, email: c.email, role: c.role })
      } catch {
        try {
          await pb
            .collection('contacts')
            .create({ name: c.name, phone: c.phone, email: c.email, role: c.role })
        } catch (e) {
          console.error('Error saving contact:', e)
        }
      }
    }
  },

  saveInspection: async (inspection: Inspection) => {
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
      answers: inspection.answers,
      notes: '',
    }
    const photos: File[] = []
    data.answers = inspection.answers.map((a) => {
      if (a.photo && a.photo.startsWith('data:')) {
        const arr = a.photo.split(',')
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
        const bstr = atob(arr[1])
        const u8 = new Uint8Array(bstr.length)
        for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i)
        photos.push(new File([u8], `item-${a.itemId}.jpg`, { type: mime }))
        return { ...a, photo: '' }
      }
      return a
    })
    if (photos.length > 0) {
      const formData = new FormData()
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined)
          formData.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
      }
      photos.forEach((p) => formData.append('photos', p))
      await pb.collection('inspections').create(formData)
    } else {
      await pb.collection('inspections').create(data)
    }
  },

  sendInspectionEmail: async (_inspection: Inspection, _contacts: Contact[]) => {
    console.log('Email sending not available in PocketBase')
    return { success: true }
  },

  archiveInspections: async (_all: boolean = false) => {
    return { success: true, message: 'Arquivamento não disponível no PocketBase', archivedCount: 0 }
  },

  getArchivedFiles: async () => {
    return []
  },

  downloadArchive: async (_fileName: string) => {
    return null
  },

  onSync: (_callback: () => void) => {
    return () => {}
  },
}
