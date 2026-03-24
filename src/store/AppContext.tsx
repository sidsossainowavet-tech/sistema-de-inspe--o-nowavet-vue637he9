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
  addInspection: (inspection: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => void
  syncData: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
  toggleItemStatus: (id: string) => void
  clearLocalData: () => void
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

      const pendingIds = new Set(pendingLocal.map((i) => i.id))
      const merged = [...pendingLocal, ...data.inspections.filter((i) => !pendingIds.has(i.id))]
      setInspectionsState(merged)
    } catch (err) {
      console.error('Failed to load cloud data', err)
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

  // Real-time synchronization subscription
  useEffect(() => {
    const unsubscribe = api.onSync(() => {
      if (isAuthenticated) {
        loadCloudData()
      }
    })
    return unsubscribe
  }, [isAuthenticated])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.verifySession()
        setProfile({
          name: user.name,
          email: user.email,
          phone: '',
          avatar: user.avatar || '',
          role: user.role,
        })
        setIsAuthenticated(true)
        await loadCloudData()
      } catch {
        setIsAuthenticated(false)
      }
      setIsCheckingSession(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    // Only cache inspections locally to persist them until they are synced to cloud
    localStorage.setItem('nowavet_local_inspections', JSON.stringify(inspections))
  }, [inspections])

  // Abstracted Setters that update React state immediately and Cloud DB asynchronously
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
    try {
      const { user } = await api.login(email, pass)
      setProfile({
        name: user.name,
        email: user.email,
        phone: '',
        avatar: user.avatar || '',
        role: user.role,
      })
      setIsAuthenticated(true)
      await loadCloudData()
      return { success: true }
    } catch (err: any) {
      return { success: false, message: err.message || 'Credenciais inválidas.' }
    }
  }

  const logout = async () => {
    await api.logout()
    setIsAuthenticated(false)
    setItemsState([])
    setFacilitiesState([])
    setEvaluatorsState([])
    setContactsState([])
    setUsersState([])
    // Keep local offline inspections
  }

  const syncData = async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    try {
      const localInspRaw = localStorage.getItem('nowavet_local_inspections')
      const currentInspections: Inspection[] = localInspRaw ? JSON.parse(localInspRaw) : []
      if (currentInspections.length > 0) {
        const cloudInspections = await api.syncInspections(currentInspections)
        setInspectionsState(cloudInspections)
      }

      // Keep other entities silently up to date with cloud
      const data = await api.getAppData()
      setItemsState(data.items)
      setFacilitiesState(data.facilities)
      setEvaluatorsState(data.evaluators)
      setContactsState(data.contacts)
      setUsersState(data.users)
    } catch (e) {
      console.error('Data Sync Error:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  const addInspection = (data: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => {
    const newInspection: Inspection = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      isSynced: false,
    }
    setInspectionsState((prev) => {
      const next = [newInspection, ...prev]
      if (navigator.onLine) {
        setTimeout(syncData, 500)
      }
      return next
    })
  }

  const toggleItemStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    )
  }

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile)
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
    if (
      confirm(
        'Tem certeza? Isso apagará todas as inspeções locais não sincronizadas e forçará recarregamento do servidor.',
      )
    ) {
      setInspectionsState((prev) => prev.filter((i) => i.isSynced))
      localStorage.removeItem('nowavet_local_inspections')
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
