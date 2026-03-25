export type StatusType = 'C' | 'NC' | 'NA' | null
export type UserRole = 'admin' | 'evaluator'

export interface ChecklistItem {
  id: string
  name: string
  active: boolean
  mandatory?: boolean
}

export interface Contact {
  id: string
  sector: string
  email: string
  phone: string
}

export interface Facility {
  id: string
  name: string
  description: string
  frequencyDays?: number
  category?: string
  managementTopics?: string[]
}

export interface Evaluator {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
}

export interface Answer {
  itemId: string
  itemName?: string
  status: StatusType
  photo?: string
  justification?: string
}

export interface Inspection {
  id: string
  facilityId?: string
  evaluatorId?: string
  structure: string
  type: 'Check-in' | 'Check-out'
  answers: Answer[]
  date: string
  startTime?: string
  endTime?: string
  durationSeconds?: number
  isSynced: boolean
  inspector: string
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  avatar: string
  role: UserRole
}

export interface UserAccount {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  password?: string
  avatar?: string
}
