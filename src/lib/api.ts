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
      const [itemsRes, facilitiesRes, evaluatorsRes, contactsRes, usersRes, inspectionsRes] =
        await Promise.all([
          supabase.from('items').select('*'),
          supabase.from('facilities').select('*'),
          supabase.from('evaluators').select('*'),
          supabase.from('contacts').select('*'),
          supabase.from('users').select('*'),
          supabase.from('inspections').select('*').order('date', { ascending: false }),
        ])

      const inspectionsData = (inspectionsRes.data || []).map((i: any) => ({
        id: i.id,
        facilityId: i.facility_id,
        evaluatorId: i.evaluator_id,
        structure: i.structure,
        type: i.type,
        date: i.date,
        startTime: i.start_time,
        endTime: i.end_time,
        durationSeconds: i.duration_seconds,
        inspector: i.inspector,
        answers: i.answers,
        isSynced: i.is_synced,
      }))

      return {
        items: itemsRes.data?.length ? itemsRes.data : defaultItems,
        facilities: facilitiesRes.data?.length
          ? facilitiesRes.data.map((f: any) => ({ ...f, frequencyDays: f.frequency_days }))
          : defaultFacilities,
        evaluators: evaluatorsRes.data?.length ? evaluatorsRes.data : defaultEvaluators,
        contacts: contactsRes.data?.length ? contactsRes.data : defaultContacts,
        users: usersRes.data?.length ? usersRes.data : [],
        inspections: inspectionsData,
      }
    }
    return {
      items: defaultItems,
      facilities: defaultFacilities,
      evaluators: defaultEvaluators,
      contacts: defaultContacts,
      users: [],
      inspections: [],
    }
  },

  manageUser: async (
    action: 'create' | 'update' | 'update_status',
    userData: any,
    password?: string,
  ) => {
    if (supabase) {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action, userData, password },
      })
      if (error) throw new Error(`Erro na comunicação com o servidor: ${error.message}`)
      if (data && data.success === false)
        throw new Error(data.error || 'Falha ao gerenciar usuário')
      return data
    }
  },

  saveUsers: async (users: UserAccount[]) => {
    if (supabase) {
      const dbUsers = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        avatar: u.avatar || null,
      }))
      const { error } = await supabase.from('users').upsert(dbUsers)
      if (error) console.error('Error saving users:', error)
    }
  },

  saveItems: async (items: ChecklistItem[]) => {
    if (supabase) {
      const { error } = await supabase.from('items').upsert(items)
      if (error) console.error('Error saving items:', error)
    }
  },

  saveFacilities: async (facilities: Facility[]) => {
    if (supabase) {
      const mapped = facilities.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        frequency_days: f.frequencyDays || null,
        category: f.category || null,
      }))
      const { error } = await supabase.from('facilities').upsert(mapped)
      if (error) console.error('Error saving facilities:', error)
    }
  },

  saveEvaluators: async (evaluators: Evaluator[]) => {
    if (supabase) {
      const { error } = await supabase.from('evaluators').upsert(evaluators)
      if (error) console.error('Error saving evaluators:', error)
    }
  },

  saveContacts: async (contacts: Contact[]) => {
    if (supabase) {
      const { error } = await supabase.from('contacts').upsert(contacts)
      if (error) console.error('Error saving contacts:', error)
    }
  },

  saveInspection: async (inspection: Inspection) => {
    if (supabase) {
      // Removendo as fotos para salvar apenas dados textuais (economia de espaço)
      const textOnlyAnswers = inspection.answers.map((a) => {
        const { photo, ...rest } = a
        return rest
      })

      const dbPayload = {
        id: inspection.id,
        facility_id: inspection.facilityId,
        evaluator_id: inspection.evaluatorId,
        structure: inspection.structure,
        type: inspection.type,
        date: inspection.date,
        start_time: inspection.startTime,
        end_time: inspection.endTime,
        duration_seconds: inspection.durationSeconds,
        inspector: inspection.inspector,
        answers: textOnlyAnswers,
        is_synced: true,
      }

      const { error } = await supabase.from('inspections').upsert(dbPayload)
      if (error) throw error
    }
  },

  sendInspectionEmail: async (inspection: Inspection, contacts: Contact[]) => {
    if (supabase) {
      const emailContacts = [
        ...contacts,
        {
          id: 'auditoria',
          sector: 'Auditoria Interna',
          email: 'auditoria.interna@nowavet.com.br',
          phone: '',
        },
      ]

      const { data, error } = await supabase.functions.invoke('send-inspection-report', {
        body: { inspection, contacts: emailContacts },
      })

      if (error) {
        throw new Error(`Erro de comunicação com o servidor: ${error.message}`)
      }
      if (data && data.success === false) {
        throw new Error(data.error || 'Falha desconhecida no provedor de e-mail.')
      }

      return data
    }
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
