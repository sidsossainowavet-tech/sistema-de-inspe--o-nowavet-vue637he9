import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  ChecklistItem,
  Contact,
  Inspection,
  UserProfile,
  Facility,
  Evaluator,
  UserAccount,
} from '@/lib/types'
import { api } from '@/lib/api'
import { defaultProfile } from '@/lib/defaults'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { SystemLogger } from '@/lib/logger'

interface AppState {
  items: ChecklistItem[]
  setItems: (val: React.SetStateAction<ChecklistItem[]>) => Promise<void>
  contacts: Contact[]
  updateContacts: (contacts: Contact[]) => Promise<void>
  facilities: Facility[]
  setFacilities: (val: React.SetStateAction<Facility[]>) => Promise<void>
  evaluators: Evaluator[]
  setEvaluators: (val: React.SetStateAction<Evaluator[]>) => Promise<void>
  inspections: Inspection[]
  profile: UserProfile
  users: UserAccount[]
  setUsers: (val: React.SetStateAction<UserAccount[]>) => Promise<void>
  isOnline: boolean
  isSyncing: boolean
  isAuthenticated: boolean
  isCheckingSession: boolean
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  addInspection: (inspection: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => Promise<string>
  syncData: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
  toggleItemStatus: (id: string) => void
  clearLocalData: () => void
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth()

  const [items, setItemsState] = useState<ChecklistItem[]>([])
  const [facilities, setFacilitiesState] = useState<Facility[]>([])
  const [evaluators, setEvaluatorsState] = useState<Evaluator[]>([])
  const [contacts, setContactsState] = useState<Contact[]>([])
  const [inspections, setInspectionsState] = useState<Inspection[]>([])
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [users, setUsersState] = useState<UserAccount[]>([])

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)

  const loadCloudData = async () => {
    try {
      const data = await api.getAppData()
      setItemsState(data.items)
      setFacilitiesState(data.facilities)
      setEvaluatorsState(data.evaluators)
      setContactsState(data.contacts)
      setUsersState(data.users)

      const localInspRaw = localStorage.getItem('nowavet_local_inspections')
      const localInsp: Inspection[] = localInspRaw ? JSON.parse(localInspRaw) : []
      const pendingLocal = localInsp.filter((i) => !i.isSynced)

      const localHistRaw = localStorage.getItem('nowavet_local_history')
      const localHist: Inspection[] = localHistRaw ? JSON.parse(localHistRaw) : []

      const localMap = new Map<string, Inspection>()
      pendingLocal.forEach((i) => localMap.set(i.id, i))
      localHist.forEach((i) => localMap.set(i.id, i))

      const allLocal = Array.from(localMap.values())

      const mergedInspections = [
        ...allLocal,
        ...data.inspections.filter((di: Inspection) => !localMap.has(di.id)),
      ]

      mergedInspections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setInspectionsState(mergedInspections)
    } catch (err) {
      console.error('Failed to load cloud data', err)
      const localInspRaw = localStorage.getItem('nowavet_local_inspections')
      const localHistRaw = localStorage.getItem('nowavet_local_history')

      const localInsp: Inspection[] = localInspRaw ? JSON.parse(localInspRaw) : []
      const localHist: Inspection[] = localHistRaw ? JSON.parse(localHistRaw) : []

      const localMap = new Map<string, Inspection>()
      localInsp.forEach((i) => localMap.set(i.id, i))
      localHist.forEach((i) => localMap.set(i.id, i))

      const allLocal = Array.from(localMap.values())
      allLocal.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (allLocal.length > 0) setInspectionsState(allLocal)
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncData()
    }
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = api.onSync(() => {
      if (isAuthenticated) {
        loadCloudData()
      }
    })
    return unsubscribe
  }, [isAuthenticated])

  useEffect(() => {
    if (auth.loading) return

    if (auth.user) {
      if (!isAuthenticated) {
        api
          .verifyUser(auth.user.email!)
          .then((u) => {
            setProfile({
              name: u.name,
              email: u.email,
              phone: u.phone || '',
              avatar: u.avatar || '',
              role: u.role,
            })
            setIsAuthenticated(true)
            loadCloudData().finally(() => setIsCheckingSession(false))
          })
          .catch(() => {
            auth.signOut()
            setIsAuthenticated(false)
            setIsCheckingSession(false)
          })
      } else {
        setIsCheckingSession(false)
      }
    } else {
      setIsAuthenticated(false)
      setIsCheckingSession(false)
    }
  }, [auth.user, auth.loading, isAuthenticated])

  useEffect(() => {
    const pending = inspections.filter((i) => !i.isSynced)
    if (pending.length === 0) return

    try {
      localStorage.setItem('nowavet_local_inspections', JSON.stringify(pending))
    } catch (error: any) {
      console.error('Erro ao salvar no localStorage:', error)
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        try {
          const stripped = pending.map((insp) => ({
            ...insp,
            answers: insp.answers.map((a) => {
              const { photo, ...rest } = a
              return rest
            }),
          }))
          localStorage.setItem('nowavet_local_inspections', JSON.stringify(stripped))
          toast.warning('Inspeções pendentes salvas sem fotos por falta de espaço.')
        } catch (e2) {
          console.error('Falha no fallback de armazenamento:', e2)
        }
      }
    }
  }, [inspections])

  const setItems = (val: React.SetStateAction<ChecklistItem[]>) => {
    return new Promise<void>((resolve) => {
      setItemsState((prev) => {
        const next = typeof val === 'function' ? (val as any)(prev) : val
        api.saveItems(next).then(resolve).catch(console.error)
        return next
      })
    })
  }

  const setFacilities = (val: React.SetStateAction<Facility[]>) => {
    return new Promise<void>((resolve) => {
      setFacilitiesState((prev) => {
        const next = typeof val === 'function' ? (val as any)(prev) : val
        api.saveFacilities(next).then(resolve).catch(console.error)
        return next
      })
    })
  }

  const setEvaluators = (val: React.SetStateAction<Evaluator[]>) => {
    return new Promise<void>((resolve) => {
      setEvaluatorsState((prev) => {
        const next = typeof val === 'function' ? (val as any)(prev) : val
        api.saveEvaluators(next).then(resolve).catch(console.error)
        return next
      })
    })
  }

  const updateContacts = (next: Contact[]) => {
    return new Promise<void>((resolve) => {
      setContactsState(next)
      api.saveContacts(next).then(resolve).catch(console.error)
    })
  }

  const setUsers = (val: React.SetStateAction<UserAccount[]>) => {
    return new Promise<void>((resolve) => {
      setUsersState((prev) => {
        const next = typeof val === 'function' ? (val as any)(prev) : val
        api.saveUsers(next).then(resolve).catch(console.error)
        return next
      })
    })
  }

  const login = async (email: string, pass: string) => {
    const { error } = await auth.signIn(email, pass)
    if (error) {
      await SystemLogger.logError(email, 'Autenticação', 'Credenciais inválidas', {
        err: error.message,
      })
      return { success: false, message: 'Email ou senha incorretos.' }
    }

    try {
      const u = await api.verifyUser(email)
      if (u.active === false) {
        await auth.signOut()
        await SystemLogger.logError(email, 'Autenticação', 'Usuário inativo', {})
        return { success: false, message: 'Usuário inativo. Contate o administrador.' }
      }
      setProfile({
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        avatar: u.avatar || '',
        role: u.role,
      })
      setIsAuthenticated(true)
      await loadCloudData()
      await SystemLogger.logAudit(email, 'Login efetuado no sistema')
      return { success: true }
    } catch (err: any) {
      await SystemLogger.logError(email, 'Autenticação', 'Usuário não cadastrado', {
        err: err.message,
      })
      await auth.signOut()
      return { success: false, message: 'Email ou senha incorretos.' }
    }
  }

  const logout = async () => {
    await SystemLogger.logAudit(profile.email, 'Logout efetuado')
    await auth.signOut()
    setIsAuthenticated(false)
    setItemsState([])
    setFacilitiesState([])
    setEvaluatorsState([])
    setContactsState([])
    setUsersState([])
  }

  const syncData = async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    try {
      const localInspRaw = localStorage.getItem('nowavet_local_inspections')
      const currentInspections: Inspection[] = localInspRaw ? JSON.parse(localInspRaw) : []
      const remaining: Inspection[] = []
      let syncSuccess = false

      for (const insp of currentInspections) {
        if (!insp.isSynced) {
          try {
            const result = await api.sendInspectionEmail(insp, contacts)
            try {
              await api.saveInspection(insp)
            } catch (dbErr: any) {
              console.warn('Backup no Supabase falhou', dbErr)
            }
            syncSuccess = true
          } catch (e: any) {
            remaining.push(insp)
          }
        }
      }

      if (remaining.length > 0) {
        try {
          localStorage.setItem('nowavet_local_inspections', JSON.stringify(remaining))
        } catch (error) {
          const stripped = remaining.map((insp) => ({
            ...insp,
            answers: insp.answers.map((a) => {
              const { photo, ...rest } = a
              return rest
            }),
          }))
          localStorage.setItem('nowavet_local_inspections', JSON.stringify(stripped))
        }
      } else if (syncSuccess) {
        localStorage.removeItem('nowavet_local_inspections')
      }

      await loadCloudData()
    } catch (e) {
      console.error('Data Sync Error:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  const addInspection = async (
    data: Omit<Inspection, 'id' | 'date' | 'isSynced'>,
  ): Promise<string> => {
    const newInspection: Inspection = {
      ...data,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      // Marca como true para evitar upload ao banco, o foco agora é a exportação manual do PDF
      isSynced: true,
    }

    try {
      const existingRaw = localStorage.getItem('nowavet_local_history')
      const existing: Inspection[] = existingRaw ? JSON.parse(existingRaw) : []
      localStorage.setItem('nowavet_local_history', JSON.stringify([newInspection, ...existing]))
    } catch (error: any) {
      console.warn('Erro ao salvar local_history:', error)
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        toast.warning(
          'Armazenamento do dispositivo cheio. O PDF deve ser exportado imediatamente.',
          { duration: 6000 },
        )
      }
    }

    // Mantém as fotos no estado para que o PDF gerado on-demand possa renderizá-las
    setInspectionsState((prev) => [newInspection, ...prev])

    SystemLogger.logAudit(profile.email, 'Nova inspeção finalizada (Armazenamento Local)', {
      inspectionId: newInspection.id,
      structure: newInspection.structure,
    })

    toast.success('Inspeção finalizada! Pronta para geração e exportação do PDF.', {
      duration: 5000,
    })
    return newInspection.id
  }

  const toggleItemStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    )
  }

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile)
    SystemLogger.logAudit(profile.email, 'Perfil atualizado', { role: newProfile.role })
    return new Promise<void>((resolve) => {
      setUsersState((prev) => {
        const next = prev.map((u) =>
          u.email === newProfile.email
            ? { ...u, name: newProfile.name, avatar: newProfile.avatar, role: newProfile.role }
            : u,
        )
        api.saveUsers(next).then(resolve).catch(console.error)
        return next
      })
    })
  }

  const clearLocalData = () => {
    if (confirm('Tem certeza? Isso apagará todas as inspeções locais permanentemente.')) {
      SystemLogger.logAudit(profile.email, 'Limpeza de cache local de inspeções')
      setInspectionsState([])
      localStorage.removeItem('nowavet_local_inspections')
      localStorage.removeItem('nowavet_local_history')
      if (navigator.onLine) {
        syncData()
      }
    }
  }

  return React.createElement(
    AppContext.Provider,
    {
      value: {
        items,
        setItems,
        facilities,
        setFacilities,
        evaluators,
        setEvaluators,
        contacts,
        updateContacts,
        inspections,
        profile,
        users,
        setUsers,
        isOnline,
        isSyncing,
        isAuthenticated,
        isCheckingSession,
        login,
        logout,
        addInspection,
        syncData,
        updateProfile,
        toggleItemStatus,
        clearLocalData,
      },
    },
    children,
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within AppProvider')
  return context
}
