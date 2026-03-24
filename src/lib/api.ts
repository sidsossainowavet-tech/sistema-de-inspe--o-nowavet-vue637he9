import { UserAccount, ChecklistItem, Facility, Evaluator, Contact, Inspection } from './types'
import {
  defaultItems,
  defaultFacilities,
  defaultEvaluators,
  defaultContacts,
  defaultInspections,
} from './defaults'

// ============================================================================
// SKIP CLOUD SDK MOCK
// Simulates the Skip Cloud centralized KV storage and Authentication service.
// Uses cross-tab BroadcastChannel to mock real-time cross-device synchronization.
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

const DB_KEY = 'skip_cloud_db_v2'
const AUTH_KEY = 'skip_cloud_auth_token'
const SYNC_CHANNEL = 'skip_cloud_sync_channel'

const getDb = (): CloudDB => {
  const saved = localStorage.getItem(DB_KEY)
  let db: CloudDB
  if (saved) {
    db = JSON.parse(saved)
    // Enforce master admin configuration is present to ensure universal login
    if (!db.users.some((u) => u.email === MASTER_ADMIN.email)) {
      db.users.push(MASTER_ADMIN)
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    }
  } else {
    db = {
      users: DEFAULT_USERS,
      items: defaultItems,
      facilities: defaultFacilities,
      evaluators: defaultEvaluators,
      contacts: defaultContacts,
      inspections: defaultInspections,
    }
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  }
  return db
}

const saveDb = (db: CloudDB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  notifySync()
}

const notifySync = () => {
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(SYNC_CHANNEL)
    channel.postMessage({ type: 'DATA_UPDATED' })
    channel.close()
  }
}

export const api = {
  login: async (email: string, pass: string) => {
    await delay(600)
    const db = getDb()
    const user = db.users.find((u) => u.email === email && u.password === pass)

    if (!user) {
      throw new Error('Credenciais inválidas.')
    }
    if (!user.active) {
      throw new Error('Sua conta está inativa. Entre em contato com o administrador.')
    }

    const payload = { id: user.id, ts: Date.now() }
    const token = btoa(JSON.stringify(payload))
    localStorage.setItem(AUTH_KEY, token)
    return { token, user }
  },

  logout: async () => {
    await delay(300)
    localStorage.removeItem(AUTH_KEY)
  },

  verifySession: async () => {
    await delay(400)
    const token = localStorage.getItem(AUTH_KEY)
    if (!token) throw new Error('No session')

    try {
      const decoded = JSON.parse(atob(token))
      const db = getDb()
      const user = db.users.find((u) => u.id === decoded.id)
      if (user && user.active) return user
      throw new Error('Invalid session')
    } catch {
      localStorage.removeItem(AUTH_KEY)
      throw new Error('Invalid session')
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

  onSync: (callback: () => void) => {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(SYNC_CHANNEL)
      channel.onmessage = (event) => {
        if (event.data?.type === 'DATA_UPDATED') {
          callback()
        }
      }
      return () => channel.close()
    }
    return () => {}
  },
}
