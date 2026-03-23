import { ChecklistItem, Contact, Facility, Evaluator, UserProfile, Inspection } from './types'

export const defaultItems: ChecklistItem[] = [
  { id: '1', name: 'Portões e Fechaduras', active: true, mandatory: true },
  { id: '2', name: 'Iluminação Interna/Externa', active: true, mandatory: true },
  { id: '3', name: 'Bebedouros e Comedouros', active: true, mandatory: true },
  { id: '4', name: 'Estrutura do Telhado', active: true, mandatory: true },
  { id: '5', name: 'Pisos e Drenagem', active: true, mandatory: true },
]

export const defaultContacts: Contact[] = [
  { id: 'c1', sector: 'Qualidade', email: 'qualidade@nowavet.com', phone: '5511999999999' },
  { id: 'c2', sector: 'Projetos', email: 'projetos@nowavet.com', phone: '5511999999998' },
  { id: 'c3', sector: 'Pesquisa Clínica', email: 'pesquisa@nowavet.com', phone: '5511999999997' },
]

export const defaultFacilities: Facility[] = [
  { id: 'f1', name: 'Galpão A', description: 'Armazenamento Principal', frequencyDays: 7 },
  { id: 'f2', name: 'Laboratório 2', description: 'Área de Testes', frequencyDays: 2 },
]

export const defaultEvaluators: Evaluator[] = [
  {
    id: 'e1',
    name: 'Inspetor Padrão',
    email: 'inspetor@nowavet.com',
    phone: '5511988887777',
    avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=12',
  },
]

export const defaultProfile: UserProfile = {
  name: 'Inspetor Padrão',
  email: 'inspetor@nowavet.com',
  phone: '(11) 98888-7777',
  avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=male&seed=12',
  role: 'admin',
}

export const defaultInspections: Inspection[] = [
  {
    id: 'i1',
    facilityId: 'f1',
    evaluatorId: 'e1',
    structure: 'Galpão A',
    type: 'Check-in',
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    startTime: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 15 * 60000).toISOString(),
    endTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    durationSeconds: 900,
    isSynced: true,
    inspector: 'Inspetor Padrão',
    answers: [
      { itemId: '1', status: 'C' },
      {
        itemId: '2',
        status: 'NC',
        justification: 'Lâmpada queimada na entrada principal',
        photo: 'https://img.usecurling.com/p/200/200?q=broken%20light',
      },
      { itemId: '3', status: 'C' },
      { itemId: '4', status: 'C' },
      { itemId: '5', status: 'C' },
    ],
  },
]
