export interface User {
  id: string
  email: string
  studioName?: string
  plan: 'free' | 'pro' | 'enterprise'
  preferences: {
    theme: 'light' | 'dark'
    defaultView: 'kanban' | 'grid' | 'calendar'
  }
}

export interface Client {
  id: string
  userId: string
  denominazione: string
  tipo: 'persona_fisica' | 'societa' | 'altro'
  codiceFiscale?: string
  partitaIva?: string
  email?: string
  pec?: string
  telefono?: string
  whatsappEnabled: boolean
  metadata: Record<string, any>
  createdAt: string
}

export interface Deadline {
  id: string
  userId: string
  clientId: string
  client?: Client
  type: string
  description?: string
  amount?: number
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignedTo?: string
  completedAt?: string
  createdAt: string
}

export type ViewType = 'kanban' | 'grid' | 'calendar'
