// Tipi generati da Supabase - per ora usiamo tipi base
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          studio_name: string | null
          plan: string
          preferences: any
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          studio_name?: string | null
          plan?: string
          preferences?: any
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          studio_name?: string | null
          plan?: string
          preferences?: any
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          userId: string
          denominazione: string
          tipo: string
          codiceFiscale: string | null
          partitaIva: string | null
          email: string | null
          pec: string | null
          telefono: string | null
          whatsappEnabled: boolean
          metadata: any
          createdAt: string
        }
        Insert: {
          id?: string
          userId: string
          denominazione: string
          tipo: string
          codiceFiscale?: string | null
          partitaIva?: string | null
          email?: string | null
          pec?: string | null
          telefono?: string | null
          whatsappEnabled?: boolean
          metadata?: any
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string
          denominazione?: string
          tipo?: string
          codiceFiscale?: string | null
          partitaIva?: string | null
          email?: string | null
          pec?: string | null
          telefono?: string | null
          whatsappEnabled?: boolean
          metadata?: any
          createdAt?: string
        }
      }
      deadlines: {
        Row: {
          id: string
          userId: string
          clientId: string
          type: string
          description: string | null
          amount: number | null
          dueDate: string
          status: string
          priority: string
          assignedTo: string | null
          completedAt: string | null
          createdAt: string
        }
        Insert: {
          id?: string
          userId: string
          clientId: string
          type: string
          description?: string | null
          amount?: number | null
          dueDate: string
          status?: string
          priority?: string
          assignedTo?: string | null
          completedAt?: string | null
          createdAt?: string
        }
        Update: {
          id?: string
          userId?: string
          clientId?: string
          type?: string
          description?: string | null
          amount?: number | null
          dueDate?: string
          status?: string
          priority?: string
          assignedTo?: string | null
          completedAt?: string | null
          createdAt?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
