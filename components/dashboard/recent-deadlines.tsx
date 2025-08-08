// ============================================
// 5. RECENT DEADLINES COMPONENT
// components/dashboard/recent-deadlines.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, User, Euro, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Deadline {
  id: string
  type: string
  description: string
  due_date: string
  status: string
  priority: string
  amount?: number
  client: {
    denominazione: string
  }
}

export function RecentDeadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDeadlines()
  }, [])

  const fetchDeadlines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('deadlines')
        .select(`
          *,
          client:clients(denominazione)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(5)

      setDeadlines(data || [])
    } catch (error) {
      console.error('Error fetching deadlines:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'normal': return 'bg-blue-100 text-blue-700'
      case 'low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prossime Scadenze</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Prossime Scadenze</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/scadenze">
            Vedi tutte
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Nessuna scadenza imminente
          </p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{deadline.type}</span>
                    <Badge className={getPriorityColor(deadline.priority)}>
                      {deadline.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {deadline.client.denominazione}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(deadline.due_date), 'dd MMM yyyy', { locale: it })}
                    </span>
                    {deadline.amount && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {deadline.amount.toLocaleString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Gestisci
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}