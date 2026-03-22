export type StatusType = 'C' | 'NC' | 'NA' | null

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
