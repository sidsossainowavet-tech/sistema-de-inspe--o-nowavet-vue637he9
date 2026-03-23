import { UserAccount } from './types'

// Mock API layer to simulate Centralized Cloud Database Integration
// In a real production environment, these functions would execute fetch() calls to a backend REST API or Supabase.

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

const getDbUsers = (): UserAccount[] => {
  const saved = localStorage.getItem('nowavet_cloud_users')
  if (saved) return JSON.parse(saved)
  return DEFAULT_USERS
}

const saveDbUsers = (users: UserAccount[]) => {
  localStorage.setItem('nowavet_cloud_users', JSON.stringify(users))
}

export const api = {
  login: async (email: string, pass: string) => {
    await delay(800) // Simulate network latency
    const users = getDbUsers()
    const user = users.find((u) => u.email === email && u.password === pass)

    if (!user) {
      throw new Error('Credenciais inválidas.')
    }
    if (!user.active) {
      throw new Error('Sua conta está inativa. Entre em contato com o administrador.')
    }

    // Generate mock session token
    const token = btoa(`${user.id}-${Date.now()}`)
    return { token, user }
  },

  verifySession: async (token: string) => {
    await delay(300)
    try {
      const decoded = atob(token)
      const userId = decoded.split('-')[0]
      const users = getDbUsers()
      const user = users.find((u) => u.id === userId)
      if (user && user.active) return user
      throw new Error('Sessão inválida')
    } catch {
      throw new Error('Sessão inválida')
    }
  },

  getUsers: async () => {
    await delay(500)
    return getDbUsers()
  },

  saveUsers: async (users: UserAccount[]) => {
    await delay(500)
    saveDbUsers(users)
    return true
  },
}
