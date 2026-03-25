import { createClient } from '@supabase/supabase-js'
import { UserAccount, ChecklistItem, Facility, Evaluator, Contact, Inspection } from './types'
import { defaultItems, defaultFacilities, defaultEvaluators, defaultContacts } from './defaults'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null

export const api = {
  verifyUser: async (email: string): Promise<UserAccount> => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single()
      if (data) return data
      if (email === 'sidsossai@nowavet.com.br') {
        return { id: 'admin', name: 'Sidimar Sossai', email, role: 'admin', active: true }
      }
      if (error) throw error
    }
    throw new Error('Supabase not configured or user not found')
  },

  getAppData: async () => {
    if (supabase) {
      const [itemsRes, facilitiesRes, evaluatorsRes, contactsRes, usersRes] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('facilities').select('*'),
        supabase.from('evaluators').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('users').select('*'),
      ])

      return {
        items: itemsRes.data?.length ? itemsRes.data : defaultItems,
        facilities: facilitiesRes.data?.length
          ? facilitiesRes.data.map((f: any) => ({ ...f, frequencyDays: f.frequency_days }))
          : defaultFacilities,
        evaluators: evaluatorsRes.data?.length ? evaluatorsRes.data : defaultEvaluators,
        contacts: contactsRes.data?.length ? contactsRes.data : defaultContacts,
        users: usersRes.data?.length ? usersRes.data : [],
      }
    }
    return {
      items: defaultItems,
      facilities: defaultFacilities,
      evaluators: defaultEvaluators,
      contacts: defaultContacts,
      users: [],
    }
  },

  saveUsers: async (users: UserAccount[]) => {
    if (supabase) await supabase.from('users').upsert(users)
  },

  saveItems: async (items: ChecklistItem[]) => {
    if (supabase) await supabase.from('items').upsert(items)
  },

  saveFacilities: async (facilities: Facility[]) => {
    if (supabase) {
      const mapped = facilities.map(({ frequencyDays, ...f }) => ({
        ...f,
        frequency_days: frequencyDays,
      }))
      await supabase.from('facilities').upsert(mapped)
    }
  },

  saveEvaluators: async (evaluators: Evaluator[]) => {
    if (supabase) await supabase.from('evaluators').upsert(evaluators)
  },

  saveContacts: async (contacts: Contact[]) => {
    if (supabase) await supabase.from('contacts').upsert(contacts)
  },

  sendInspectionEmail: async (inspection: Inspection, contacts: Contact[]) => {
    if (supabase) {
      const { data, error } = await supabase.functions.invoke('send-inspection-report', {
        body: { inspection, contacts },
      })
      if (error) throw error
      return data
    }
    // Mock success for offline testing
    console.log('Mock: Inspection email sent for', inspection.id)
    return { success: true }
  },

  onSync: (callback: () => void) => {
    if (supabase) {
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
    return () => {}
  },
}
