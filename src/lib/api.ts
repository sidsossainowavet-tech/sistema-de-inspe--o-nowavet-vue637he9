import { createClient } from '@supabase/supabase-js'
import { UserAccount, ChecklistItem, Facility, Evaluator, Contact, Inspection } from './types'
import {
  defaultItems,
  defaultFacilities,
  defaultEvaluators,
  defaultContacts,
  defaultInspections,
} from './defaults'

// ============================================================================
// CLOUD DATABASE INTEGRATION
// Implements Supabase with automatic fallback to local mock if env vars are missing
// ensuring the app is always functional even without external configuration.
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null

// --- Mock Fallback Logic ---
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
// --- End Mock Logic ---

export const api = {
  login: async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) throw new Error('Credenciais inválidas.')

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userError || !user) {
        // Fallback user format if it exists in auth but not in users table yet
        const fallbackUser: UserAccount = {
          id: data.user?.id || 'unknown',
          name: email.split('@')[0],
          email,
          role: email === MASTER_ADMIN.email ? 'admin' : 'evaluator',
          active: true,
        }
        return { token: data.session.access_token, user: fallbackUser }
      }

      if (!user.active) throw new Error('Sua conta está inativa. Contate o administrador.')

      return { token: data.session.access_token, user }
    }

    await delay(600)
    const db = getDb()
    const user = db.users.find((u) => u.email === email && u.password === pass)

    if (!user) throw new Error('Credenciais inválidas.')
    if (!user.active) throw new Error('Sua conta está inativa. Contate o administrador.')

    const payload = { id: user.id, ts: Date.now() }
    const token = btoa(JSON.stringify(payload))
    localStorage.setItem(AUTH_KEY, token)
    return { token, user }
  },

  logout: async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
      return
    }
    await delay(300)
    localStorage.removeItem(AUTH_KEY)
  },

  verifySession: async () => {
    if (isSupabaseConfigured && supabase) {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error || !session) throw new Error('No session')

      const email = session.user.email
      const { data: user } = await supabase.from('users').select('*').eq('email', email).single()

      if (user && user.active) return user
      if (!user) {
        return {
          id: session.user.id,
          email: email || '',
          name: email?.split('@')[0] || 'Usuário',
          role: email === MASTER_ADMIN.email ? 'admin' : 'evaluator',
          active: true,
        }
      }
      throw new Error('Invalid session')
    }

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
    if (isSupabaseConfigured && supabase) {
      const [itemsRes, facilitiesRes, evaluatorsRes, contactsRes, usersRes, inspectionsRes] =
        await Promise.all([
          supabase.from('items').select('*'),
          supabase.from('facilities').select('*'),
          supabase.from('evaluators').select('*'),
          supabase.from('contacts').select('*'),
          supabase.from('users').select('*'),
          supabase.from('inspections').select('*').order('date', { ascending: false }),
        ])

      return {
        items: itemsRes.data?.length ? itemsRes.data : defaultItems,
        facilities: facilitiesRes.data?.length ? facilitiesRes.data : defaultFacilities,
        evaluators: evaluatorsRes.data?.length ? evaluatorsRes.data : defaultEvaluators,
        contacts: contactsRes.data?.length ? contactsRes.data : defaultContacts,
        users: usersRes.data?.length ? usersRes.data : DEFAULT_USERS,
        inspections: inspectionsRes.data?.length ? inspectionsRes.data : defaultInspections,
      }
    }

    await delay(400)
    return getDb()
  },

  saveUsers: async (users: UserAccount[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('users').upsert(users)
      if (error) console.error('Supabase Error:', error)
      return true
    }
    await delay(300)
    const db = getDb()
    db.users = users
    saveDb(db)
    return true
  },

  saveItems: async (items: ChecklistItem[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('items').upsert(items)
      if (error) console.error('Supabase Error:', error)
      return true
    }
    await delay(200)
    const db = getDb()
    db.items = items
    saveDb(db)
    return true
  },

  saveFacilities: async (facilities: Facility[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('facilities').upsert(facilities)
      if (error) console.error('Supabase Error:', error)
      return true
    }
    await delay(200)
    const db = getDb()
    db.facilities = facilities
    saveDb(db)
    return true
  },

  saveEvaluators: async (evaluators: Evaluator[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('evaluators').upsert(evaluators)
      if (error) console.error('Supabase Error:', error)
      return true
    }
    await delay(200)
    const db = getDb()
    db.evaluators = evaluators
    saveDb(db)
    return true
  },

  saveContacts: async (contacts: Contact[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('contacts').upsert(contacts)
      if (error) console.error('Supabase Error:', error)
      return true
    }
    await delay(200)
    const db = getDb()
    db.contacts = contacts
    saveDb(db)
    return true
  },

  syncInspections: async (inspections: Inspection[]) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('inspections')
        .upsert(inspections.map((i) => ({ ...i, isSynced: true })))
        .select()

      if (error) {
        console.error('Supabase Error:', error)
        throw error
      }

      const { data: allInspections } = await supabase
        .from('inspections')
        .select('*')
        .order('date', { ascending: false })
      return allInspections || []
    }

    await delay(600)
    const db = getDb()
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
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          callback()
        })
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    }

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
