export type StatusType = 'C' | 'NC' | 'NA' | null

export interface ChecklistItem {
  id: string
  name: string
  active: boolean
}

export interface Contact {
  id: string
  sector: string
  email: string
  phone: string
}

export interface Answer {
  itemId: string
  status: StatusType
  photo?: string
  justification?: string
}

export interface Inspection {
  id: string
  structure: string
  type: 'Check-in' | 'Check-out'
  answers: Answer[]
  date: string
  isSynced: boolean
  inspector: string
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  avatar: string
}
