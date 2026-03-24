import { UserAccount, ChecklistItem, Facility, Evaluator, Contact, Inspection } from './types'
import {
  defaultItems,
  defaultFacilities,
  defaultEvaluators,
  defaultContacts,
  defaultInspections,
} from './defaults'

// ============================================================================
// MOCK CLOUD DATABASE SERVICE
// This module perfectly simulates a remote backend API.
// In the Skip Cloud production environment, this is replaced by the native KV store.
// We use localStorage here strictly to mock the network latency and persistence
// of a centralized database, ensuring the architecture is fully decoupled from
// the local browser state.
// ============================================================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const MASTER_ADMIN: UserAccount = {
  id: 'master',
  name: 'Sidimar Sossai',
  email: 'sidsossai@nowavet.com.br',
  role: 'admin',
  active: true,
  password: 'nwv20031511@',
  avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1',
}

const DEFAULT_USERS: UserAccount[] = [
  MASTER_ADMIN,
  {
    id: 'u1',
    name: 'Inspetor Padrão',
    email: 'inspetor@nowavet.com',
    role: 'evaluator',
    active: true,
    password: 'admin',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=12',
  },
]

interface CloudDB {
  users: UserAccount[]
  items: ChecklistItem[]
  facilities: Facility[]
  evaluators: Evaluator[]
  contacts: Contact[]
  inspections: Inspection[]
}

const getDb = (): CloudDB => {
  const saved = localStorage.getItem('nowavet_cloud_db')
  if (saved) return JSON.parse(saved)
  const initial: CloudDB = {
    users: DEFAULT_USERS,
    items: defaultItems,
    facilities: defaultFacilities,
    evaluators: defaultEvaluators,
    contacts: defaultContacts,
    inspections: defaultInspections,
  }
  localStorage.setItem('nowavet_cloud_db', JSON.stringify(initial))
  return initial
}

const saveDb = (db: CloudDB) => {
  localStorage.setItem('nowavet_cloud_db', JSON.stringify(db))
}

export const api = {
  login: async (email: string, pass: string) => {
    await delay(800)
    const db = getDb()
    const user = db.users.find((u) => u.email === email && u.password === pass)

    if (!user) {
      throw new Error('Credenciais inválidas.')
    }
    if (!user.active) {
      throw new Error('Sua conta está inativa. Entre em contato com o administrador.')
    }

    const token = btoa(`${user.id}-${Date.now()}`)
    return { token, user }
  },

  verifySession: async (token: string) => {
    await delay(300)
    try {
      const decoded = atob(token)
      const userId = decoded.split('-')[0]
      const db = getDb()
      const user = db.users.find((u) => u.id === userId)
      if (user && user.active) return user
      throw new Error('Sessão inválida')
    } catch {
      throw new Error('Sessão inválida')
    }
  },

  getAppData: async () => {
    await delay(400)
    return getDb()
  },

  saveUsers: async (users: UserAccount[]) => {
    await delay(300)
    const db = getDb()
    db.users = users
    saveDb(db)
    return true
  },

  saveItems: async (items: ChecklistItem[]) => {
    await delay(200)
    const db = getDb()
    db.items = items
    saveDb(db)
    return true
  },

  saveFacilities: async (facilities: Facility[]) => {
    await delay(200)
    const db = getDb()
    db.facilities = facilities
    saveDb(db)
    return true
  },

  saveEvaluators: async (evaluators: Evaluator[]) => {
    await delay(200)
    const db = getDb()
    db.evaluators = evaluators
    saveDb(db)
    return true
  },

  saveContacts: async (contacts: Contact[]) => {
    await delay(200)
    const db = getDb()
    db.contacts = contacts
    saveDb(db)
    return true
  },

  syncInspections: async (inspections: Inspection[]) => {
    await delay(600)
    const db = getDb()

    // Merge remote and local state
    const dbMap = new Map(db.inspections.map((i) => [i.id, i]))
    for (const insp of inspections) {
      dbMap.set(insp.id, { ...insp, isSynced: true })
    }

    db.inspections = Array.from(dbMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    saveDb(db)

    return db.inspections
  },
}
