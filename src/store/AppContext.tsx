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
import {
  defaultItems,
  defaultContacts,
  defaultFacilities,
  defaultEvaluators,
  defaultProfile,
  defaultInspections,
} from '@/lib/defaults'

interface AppState {
  items: ChecklistItem[]
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  contacts: Contact[]
  updateContacts: (contacts: Contact[]) => void
  facilities: Facility[]
  setFacilities: React.Dispatch<React.SetStateAction<Facility[]>>
  evaluators: Evaluator[]
  setEvaluators: React.Dispatch<React.SetStateAction<Evaluator[]>>
  inspections: Inspection[]
  profile: UserProfile
  users: UserAccount[]
  setUsers: (users: UserAccount[] | ((prev: UserAccount[]) => UserAccount[])) => Promise<void>
  isOnline: boolean
  isSyncing: boolean
  isAuthenticated: boolean
  isCheckingSession: boolean
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  addInspection: (inspection: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => void
  syncData: () => Promise<void>
  updateProfile: (profile: UserProfile) => Promise<void>
  toggleItemStatus: (id: string) => void
  clearLocalData: () => void
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('nowavet_items')
    return saved ? JSON.parse(saved) : defaultItems
  })
  const [facilities, setFacilities] = useState<Facility[]>(() => {
    const saved = localStorage.getItem('nowavet_facilities')
    return saved ? JSON.parse(saved) : defaultFacilities
  })
  const [evaluators, setEvaluators] = useState<Evaluator[]>(() => {
    const saved = localStorage.getItem('nowavet_evaluators')
    return saved ? JSON.parse(saved) : defaultEvaluators
  })
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('nowavet_contacts')
    return saved ? JSON.parse(saved) : defaultContacts
  })
  const [inspections, setInspections] = useState<Inspection[]>(() => {
    const saved = localStorage.getItem('nowavet_inspections')
    return saved ? JSON.parse(saved) : defaultInspections
  })

  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [users, setUsersState] = useState<UserAccount[]>([])

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)

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
    const checkAuth = async () => {
      const token = localStorage.getItem('nowavet_session_token')
      if (token) {
        try {
          const user = await api.verifySession(token)
          setProfile({
            name: user.name,
            email: user.email,
            phone: '',
            avatar: user.avatar || '',
            role: user.role,
          })
          setIsAuthenticated(true)
          if (user.role === 'admin') {
            setUsersState(await api.getUsers())
          }
        } catch {
          localStorage.removeItem('nowavet_session_token')
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
      setIsCheckingSession(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    localStorage.setItem('nowavet_items', JSON.stringify(items))
  }, [items])
  useEffect(() => {
    localStorage.setItem('nowavet_facilities', JSON.stringify(facilities))
  }, [facilities])
  useEffect(() => {
    localStorage.setItem('nowavet_evaluators', JSON.stringify(evaluators))
  }, [evaluators])
  useEffect(() => {
    localStorage.setItem('nowavet_contacts', JSON.stringify(contacts))
  }, [contacts])
  useEffect(() => {
    localStorage.setItem('nowavet_inspections', JSON.stringify(inspections))
  }, [inspections])

  const setUsers = async (newUsers: UserAccount[] | ((prev: UserAccount[]) => UserAccount[])) => {
    const toSave = typeof newUsers === 'function' ? newUsers(users) : newUsers
    setUsersState(toSave)
    await api.saveUsers(toSave)
  }

  const login = async (email: string, pass: string) => {
    try {
      const { token, user } = await api.login(email, pass)
      localStorage.setItem('nowavet_session_token', token)
      setProfile({
        name: user.name,
        email: user.email,
        phone: '',
        avatar: user.avatar || '',
        role: user.role,
      })
      setIsAuthenticated(true)
      if (user.role === 'admin') {
        setUsersState(await api.getUsers())
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, message: err.message || 'Credenciais inválidas.' }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('nowavet_session_token')
  }

  const syncData = async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    await new Promise((r) => setTimeout(r, 1500))
    setInspections((prev) => prev.map((i) => ({ ...i, isSynced: true })))
    setIsSyncing(false)
  }

  const addInspection = (data: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => {
    const newInspection: Inspection = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      isSynced: isOnline,
    }
    setInspections((prev) => [newInspection, ...prev])
  }

  const toggleItemStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    )
  }

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile)
    const updatedUsers = users.map((u) =>
      u.email === newProfile.email
        ? { ...u, name: newProfile.name, avatar: newProfile.avatar, role: newProfile.role }
        : u,
    )
    setUsersState(updatedUsers)
    await api.saveUsers(updatedUsers)
  }

  const clearLocalData = () => {
    if (confirm('Tem certeza? Isso apagará todas as inspeções locais não sincronizadas.')) {
      setInspections([])
      localStorage.removeItem('nowavet_inspections')
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
        updateContacts: setContacts,
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
