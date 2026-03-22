import React, { createContext, useContext, useState, useEffect } from 'react'
import { ChecklistItem, Contact, Inspection, UserProfile } from '@/lib/types'

interface AppState {
  items: ChecklistItem[]
  contacts: Contact[]
  inspections: Inspection[]
  profile: UserProfile
  isOnline: boolean
  isSyncing: boolean
  addInspection: (inspection: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => void
  syncData: () => Promise<void>
  updateProfile: (profile: UserProfile) => void
  toggleItemStatus: (id: string) => void
  updateContacts: (contacts: Contact[]) => void
  clearLocalData: () => void
}

const defaultItems: ChecklistItem[] = [
  { id: '1', name: 'Portões e Fechaduras', active: true },
  { id: '2', name: 'Iluminação Interna/Externa', active: true },
  { id: '3', name: 'Bebedouros e Comedouros', active: true },
  { id: '4', name: 'Estrutura do Telhado', active: true },
  { id: '5', name: 'Pisos e Drenagem', active: true },
]

const defaultContacts: Contact[] = [
  { id: 'c1', sector: 'Qualidade', email: 'qualidade@nowavet.com', phone: '5511999999999' },
  { id: 'c2', sector: 'Projetos', email: 'projetos@nowavet.com', phone: '5511999999998' },
  { id: 'c3', sector: 'Pesquisa Clínica', email: 'pesquisa@nowavet.com', phone: '5511999999997' },
]

const defaultProfile: UserProfile = {
  name: 'Inspetor Padrão',
  email: 'inspetor@nowavet.com',
  phone: '(11) 98888-7777',
  avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=12',
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('nowavet_items')
    return saved ? JSON.parse(saved) : defaultItems
  })

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('nowavet_contacts')
    return saved ? JSON.parse(saved) : defaultContacts
  })

  const [inspections, setInspections] = useState<Inspection[]>(() => {
    const saved = localStorage.getItem('nowavet_inspections')
    return saved ? JSON.parse(saved) : []
  })

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nowavet_profile')
    return saved ? JSON.parse(saved) : defaultProfile
  })

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
    localStorage.setItem('nowavet_items', JSON.stringify(items))
  }, [items])
  useEffect(() => {
    localStorage.setItem('nowavet_contacts', JSON.stringify(contacts))
  }, [contacts])
  useEffect(() => {
    localStorage.setItem('nowavet_inspections', JSON.stringify(inspections))
  }, [inspections])
  useEffect(() => {
    localStorage.setItem('nowavet_profile', JSON.stringify(profile))
  }, [profile])

  const syncData = async () => {
    if (!navigator.onLine) return
    setIsSyncing(true)
    // Simulate network delay
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
    if (!isOnline) {
      // Simulate queuing
    }
  }

  const toggleItemStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
    )
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
        contacts,
        inspections,
        profile,
        isOnline,
        isSyncing,
        addInspection,
        syncData,
        updateProfile: setProfile,
        toggleItemStatus,
        updateContacts: setContacts,
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
