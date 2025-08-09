// ============================================
// 4. RECENT DEADLINES - VERSIONE CORRETTA
// components/dashboard/recent-deadlines.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, User, Euro, ChevronRight, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Deadline {
  id: string
  type: string
  description: string
  due_date: string
  status: string
  priority: string
  amount?: number
  client: {
    id: string
    denominazione: string
  }
}

export function RecentDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchDeadlines()
    
    // Setup realtime subscription
    const channel = supabase
      .channel('recent-deadlines')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deadlines' },
        () => fetchDeadlines()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const fetchDeadlines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('deadlines')
        .select(`
          *,
          client:clients(id, denominazione)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(5)

      if (error) throw error
      setDeadlines(data || [])
    } catch (error) {
      console.error('Error fetching deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      normal: 'bg-blue-100 text-blue-700 border-blue-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Urgente',
      high: 'Alta',
      normal: 'Normale',
      low: 'Bassa'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const getDaysUntilDue = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date())
    if (days < 0) return { text: `${Math.abs(days)} giorni fa`, isOverdue: true }
    if (days === 0) return { text: 'Oggi', isOverdue: false }
    if (days === 1) return { text: 'Domani', isOverdue: false }
    return { text: `${days} giorni`, isOverdue: false }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Prossime Scadenze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Prossime Scadenze
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/scadenze">
            Vedi tutte
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Nessuna scadenza imminente</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push('/dashboard/scadenze/new')}
            >
              Aggiungi prima scadenza
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline) => {
              const daysInfo = getDaysUntilDue(deadline.due_date)
              
              return (
                <div
                  key={deadline.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                    daysInfo.isOverdue && "border-red-200 bg-red-50"
                  )}
                  onClick={() => router.push(`/dashboard/scadenze/${deadline.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {deadline.type}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getPriorityColor(deadline.priority))}
                      >
                        {getPriorityLabel(deadline.priority)}
                      </Badge>
                      {daysInfo.isOverdue && (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    
                    {deadline.description && (
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {deadline.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{deadline.client.denominazione}</span>
                      </span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(deadline.due_date), 'dd MMM', { locale: it })}
                      </span>
                      {deadline.amount && deadline.amount > 0 && (
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Euro className="h-3 w-3" />
                          {deadline.amount.toLocaleString('it-IT')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3">
                    <div className={cn(
                      "text-xs font-medium px-2 py-1 rounded",
                      daysInfo.isOverdue 
                        ? "bg-red-100 text-red-700" 
                        : "bg-gray-100 text-gray-700"
                    )}>
                      {daysInfo.text}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/scadenze/${deadline.id}/edit`)
                      }}
                    >
                      Gestisci
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}