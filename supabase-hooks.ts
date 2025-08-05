// ===== hooks/useRealtimeDeadlines.ts =====
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import type { Deadline, Client } from '@/types/app.types'
import type { Database } from '@/types/database.types'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtimeDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('deadlines')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('user_id', user.id)
          .order('due_date', { ascending: true })

        if (error) throw error
        setDeadlines(data || [])
      } catch (err) {
        setError(err as Error)
        toast({
          title: 'Errore',
          description: 'Impossibile caricare le scadenze',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDeadlines()

    // Setup realtime subscription
    const channel = supabase
      .channel('deadline-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deadlines'
        },
        (payload: RealtimePostgresChangesPayload<Deadline>) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, toast])

  const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<Deadline>) => {
    if (payload.eventType === 'INSERT' && payload.new) {
      setDeadlines(prev => [...prev, payload.new as Deadline])
      toast({
        title: 'Nuova scadenza',
        description: `Aggiunta scadenza: ${payload.new.type}`
      })
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setDeadlines(prev => 
        prev.map(d => d.id === payload.new.id ? payload.new as Deadline : d)
      )
    } else if (payload.eventType === 'DELETE' && payload.old) {
      setDeadlines(prev => prev.filter(d => d.id !== payload.old.id))
    }
  }

  const updateDeadlineStatus = async (id: string, status: Deadline['status']) => {
    try {
      const { error } = await supabase
        .from('deadlines')
        .update({ 
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare lo stato',
        variant: 'destructive'
      })
    }
  }

  return { 
    deadlines, 
    loading, 
    error, 
    updateDeadlineStatus,
    refetch: () => window.location.reload() // Simple refetch
  }
}

// ===== hooks/useClients.ts =====
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import type { Client } from '@/types/app.types'
import type { Database } from '@/types/database.types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('denominazione')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err as Error)
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i clienti',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addClient = async (clientData: Omit<Client, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      
      setClients(prev => [...prev, data])
      toast({
        title: 'Cliente aggiunto',
        description: `${clientData.denominazione} è stato aggiunto con successo`
      })
      
      return data
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile aggiungere il cliente',
        variant: 'destructive'
      })
      throw err
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      setClients(prev => prev.map(c => c.id === id ? data : c))
      toast({
        title: 'Cliente aggiornato',
        description: 'Le modifiche sono state salvate'
      })
      
      return data
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile aggiornare il cliente',
        variant: 'destructive'
      })
      throw err
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setClients(prev => prev.filter(c => c.id !== id))
      toast({
        title: 'Cliente eliminato',
        description: 'Il cliente è stato rimosso con successo'
      })
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile eliminare il cliente',
        variant: 'destructive'
      })
      throw err
    }
  }

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  }
}

// ===== hooks/useUserPreferences.ts =====
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@/types/app.types'

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<User['preferences']>({
    theme: 'light',
    defaultView: 'kanban'
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data?.preferences) {
        setPreferences(data.preferences)
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<User['preferences']>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newPreferences = { ...preferences, ...updates }
      
      const { error } = await supabase
        .from('users')
        .update({ preferences: newPreferences })
        .eq('id', user.id)

      if (error) throw error
      
      setPreferences(newPreferences)
      
      // Apply theme if changed
      if (updates.theme) {
        document.documentElement.classList.toggle('dark', updates.theme === 'dark')
      }
    } catch (err) {
      console.error('Error updating preferences:', err)
    }
  }

  return {
    preferences,
    loading,
    updatePreferences
  }
}

// ===== hooks/useAIInsights.ts =====
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Deadline } from '@/types/app.types'

interface AIInsight {
  id: string
  type: 'tip' | 'warning' | 'trend'
  title: string
  description: string
  priority: number
  action?: {
    label: string
    url: string
  }
}

export function useAIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    generateInsights()
  }, [])

  const generateInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's deadlines
      const { data: deadlines } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', user.id)

      if (!deadlines) return

      // Generate insights based on deadlines
      const newInsights: AIInsight[] = []

      // Check for urgent deadlines
      const urgentDeadlines = deadlines.filter(d => {
        const daysUntilDue = Math.ceil(
          (new Date(d.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilDue <= 3 && d.status !== 'completed'
      })

      if (urgentDeadlines.length > 0) {
        newInsights.push({
          id: '1',
          type: 'warning',
          title: `${urgentDeadlines.length} scadenze urgenti`,
          description: `Hai ${urgentDeadlines.length} scadenze nei prossimi 3 giorni`,
          priority: 1,
          action: {
            label: 'Visualizza',
            url: '/dashboard/scadenze?filter=urgent'
          }
        })
      }

      // Check completion rate
      const completedCount = deadlines.filter(d => d.status === 'completed').length
      const completionRate = deadlines.length > 0 
        ? Math.round((completedCount / deadlines.length) * 100)
        : 0

      if (completionRate > 80) {
        newInsights.push({
          id: '2',
          type: 'trend',
          title: 'Ottimo tasso di completamento',
          description: `Hai completato il ${completionRate}% delle tue scadenze`,
          priority: 3
        })
      }

      // Suggest automation
      const clientsWithoutWhatsApp = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .eq('whatsapp_enabled', false)

      if (clientsWithoutWhatsApp.data && clientsWithoutWhatsApp.data.length > 5) {
        newInsights.push({
          id: '3',
          type: 'tip',
          title: 'Automatizza i promemoria',
          description: 'Attiva WhatsApp per inviare reminder automatici',
          priority: 2,
          action: {
            label: 'Configura',
            url: '/dashboard/impostazioni/whatsapp'
          }
        })
      }

      setInsights(newInsights.sort((a, b) => a.priority - b.priority))
    } catch (err) {
      console.error('Error generating insights:', err)
    } finally {
      setLoading(false)
    }
  }

  return { insights, loading, refetch: generateInsights }
}

// ===== hooks/useStats.ts =====
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Stats {
  total: number
  upcoming: number
  completed: number
  overdue: number
  completionRate: number
  totalChange?: string
  upcomingDays?: number
}

export function useRealtimeStats() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    calculateStats()

    // Subscribe to changes
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deadlines'
        },
        () => {
          calculateStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const calculateStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: deadlines } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', user.id)

      if (!deadlines) return

      const now = new Date()
      const stats: Stats = {
        total: deadlines.length,
        completed: deadlines.filter(d => d.status === 'completed').length,
        overdue: deadlines.filter(d => 
          new Date(d.due_date) < now && d.status !== 'completed'
        ).length,
        upcoming: deadlines.filter(d => {
          const dueDate = new Date(d.due_date)
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntil >= 0 && daysUntil <= 7 && d.status !== 'completed'
        }).length,
        completionRate: 0
      }

      stats.completionRate = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100)
        : 0

      // Calculate month-over-month change
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const { data: lastMonthDeadlines } = await supabase
        .from('deadlines')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', lastMonth.toISOString())

      if (lastMonthDeadlines) {
        const change = lastMonthDeadlines.length > 0 
          ? Math.round(((deadlines.length - lastMonthDeadlines.length) / lastMonthDeadlines.length) * 100)
          : 0
        stats.totalChange = change >= 0 ? `+${change}%` : `${change}%`
      }

      setStats(stats)
    } catch (err) {
      console.error('Error calculating stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading }
}