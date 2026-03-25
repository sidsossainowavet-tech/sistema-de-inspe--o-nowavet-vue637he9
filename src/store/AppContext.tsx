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
  addInspection: (inspection: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => Promise<void>
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

      const mergedInspections = [
        ...pendingLocal,
        ...data.inspections.filter(
          (di: Inspection) => !pendingLocal.some((pl: Inspection) => pl.id === di.id),
        ),
      ]
      setInspectionsState(mergedInspections)
    } catch (err) {
      console.error('Failed to load cloud data', err)
      const localInspRaw = localStorage.getItem('nowavet_local_inspections')
      if (localInspRaw) setInspectionsState(JSON.parse(localInspRaw))
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
    try {
      localStorage.setItem('nowavet_local_inspections', JSON.stringify(pending))
    } catch (error: any) {
      console.error('Erro ao salvar no localStorage:', error)
      if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
        toast.error('Armazenamento do dispositivo cheio.')
        try {
          const stripped = pending.map((insp) => ({
            ...insp,
            answers: insp.answers.map((a) => {
              const { photo, ...rest } = a
              return rest
            }),
          }))
          localStorage.setItem('nowavet_local_inspections', JSON.stringify(stripped))
          toast.warning('Inspeções pendentes foram salvas sem fotos devido à falta de espaço.')
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
      return { success: false, message: 'Credenciais inválidas.' }
    }

    try {
      const u = await api.verifyUser(email)
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
      return { success: false, message: 'Usuário não cadastrado na base de dados.' }
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
            // Prioriza o envio de email direto
            const result = await api.sendInspectionEmail(insp, contacts)

            // Tenta salvar na nuvem apenas como backup.
            // Se falhar o estocamento na nuvem, o processo continua sem bloquear.
            try {
              await api.saveInspection(insp)
            } catch (dbErr: any) {
              console.warn('Backup no Supabase falhou, mas email foi enviado:', dbErr)
            }

            syncSuccess = true

            if (result && result.emailError) {
              toast.warning(
                `Sincronização (${insp.structure}): Erro no e-mail - ${result.emailError}`,
              )
              SystemLogger.logError(
                profile.email,
                'Sincronização Automática (E-mail)',
                result.emailError,
                { inspectionId: insp.id },
              )
            }
            if (result && result.whatsappError && !result.whatsappError.includes('Simulação')) {
              toast.warning(
                `Sincronização (${insp.structure}): Erro no WhatsApp - ${result.whatsappError}`,
              )
              SystemLogger.logError(
                profile.email,
                'Sincronização Automática (WhatsApp)',
                result.whatsappError,
                { inspectionId: insp.id },
              )
            }
            SystemLogger.logAudit(profile.email, 'Inspeção sincronizada', {
              inspectionId: insp.id,
              structure: insp.structure,
            })
          } catch (e: any) {
            console.error('Falha na sincronização da inspeção:', insp.id, e)
            toast.error(`Aviso (${insp.structure}): ${e.message}`)
            SystemLogger.logError(profile.email, 'Falha Geral na Sincronização', e.message, {
              inspectionId: insp.id,
            })
            remaining.push(insp)
          }
        }
      }

      if (remaining.length > 0) {
        try {
          localStorage.setItem('nowavet_local_inspections', JSON.stringify(remaining))
        } catch (error: any) {
          console.error('Erro de quota durante sync:', error)
          try {
            const stripped = remaining.map((insp) => ({
              ...insp,
              answers: insp.answers.map((a) => {
                const { photo, ...rest } = a
                return rest
              }),
            }))
            localStorage.setItem('nowavet_local_inspections', JSON.stringify(stripped))
          } catch (e2) {
            console.error('Falha no fallback do sync:', e2)
          }
        }
      } else if (syncSuccess) {
        localStorage.removeItem('nowavet_local_inspections')
      }

      await loadCloudData()

      if (syncSuccess && remaining.length === 0) {
        toast.success('Todas as inspeções pendentes foram sincronizadas.')
      }
    } catch (e) {
      console.error('Data Sync Error:', e)
    } finally {
      setIsSyncing(false)
    }
  }

  const addInspection = async (data: Omit<Inspection, 'id' | 'date' | 'isSynced'>) => {
    const newInspection: Inspection = {
      ...data,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      isSynced: false,
    }

    if (navigator.onLine) {
      setIsSyncing(true)
      try {
        // Envio direto por e-mail é o prioritário
        const result = await api.sendInspectionEmail(newInspection, contacts)

        // Backup na base de dados sem interrupções se falhar (Ignora estocagem obrigatória)
        try {
          await api.saveInspection(newInspection)
        } catch (dbErr: any) {
          console.warn(
            'Falha ao estocar inspeção na nuvem. Ignorando para focar no envio direto de e-mail.',
            dbErr,
          )
          SystemLogger.logError(profile.email, 'Backup em Nuvem', dbErr.message, {
            inspectionId: newInspection.id,
          })
        }

        SystemLogger.logAudit(
          profile.email,
          'Nova inspeção registrada e enviada direto por e-mail',
          {
            inspectionId: newInspection.id,
            structure: newInspection.structure,
          },
        )

        const textOnlyAnswers = newInspection.answers.map((a) => {
          const { photo, ...rest } = a
          return rest
        })
        const textOnlyInsp = { ...newInspection, answers: textOnlyAnswers, isSynced: true }

        if (result.emailError) {
          toast.warning(`Relatório processado, mas ocorreu erro no E-mail: ${result.emailError}`, {
            duration: 6000,
          })
          SystemLogger.logError(profile.email, 'Envio de Relatório (E-mail)', result.emailError, {
            inspectionId: newInspection.id,
          })
        } else {
          toast.success(
            'Relatório gerado e encaminhado direto para a Auditoria Interna com sucesso!',
          )
        }

        if (result.whatsappError && !result.whatsappError.includes('Simulação')) {
          toast.warning(`Erro no envio via WhatsApp: ${result.whatsappError}`, { duration: 6000 })
          SystemLogger.logError(
            profile.email,
            'Envio de Relatório (WhatsApp)',
            result.whatsappError,
            { inspectionId: newInspection.id },
          )
        } else if (!result.whatsappError) {
          toast.success('Relatório também encaminhado para o WhatsApp cadastrado (com fotos)!')
        }

        setInspectionsState((prev) => [textOnlyInsp, ...prev])
      } catch (e: any) {
        console.error('Erro geral no envio:', e)
        toast.error(
          `Falha de comunicação: ${e.message}. A inspeção foi salva localmente para reenvio.`,
          {
            duration: 8000,
          },
        )
        SystemLogger.logError(profile.email, 'Processamento Crítico de Inspeção', e.message, {
          inspectionId: newInspection.id,
        })
        setInspectionsState((prev) => [newInspection, ...prev])
      } finally {
        setIsSyncing(false)
      }
    } else {
      setInspectionsState((prev) => [newInspection, ...prev])
      SystemLogger.logAudit(profile.email, 'Nova inspeção registrada (Offline)', {
        inspectionId: newInspection.id,
        structure: newInspection.structure,
      })
      toast.info(
        'Modo Offline. Inspeção salva localmente com fotos. Será encaminhada por e-mail assim que reconectar.',
      )
    }
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
    if (
      confirm(
        'Tem certeza? Isso apagará todas as inspeções locais não sincronizadas permanentemente.',
      )
    ) {
      SystemLogger.logAudit(profile.email, 'Limpeza de cache local de inspeções')
      setInspectionsState([])
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
