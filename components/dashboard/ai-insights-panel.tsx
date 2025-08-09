// ============================================
// 2. AI INSIGHTS PANEL - VERSIONE CORRETTA
// components/dashboard/ai-insights-panel.tsx
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, AlertTriangle, Clock, TrendingUp, ChevronRight, Sparkles } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Insight {
  id: string
  type: 'urgent' | 'warning' | 'tip' | 'trend'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  priority: number
}

const iconMap = {
  urgent: AlertTriangle,
  warning: Clock,
  tip: Sparkles,
  trend: TrendingUp
}

const colorMap = {
  urgent: 'text-red-600 bg-red-50',
  warning: 'text-orange-600 bg-orange-50',
  tip: 'text-blue-600 bg-blue-50',
  trend: 'text-green-600 bg-green-50'
}

function InsightItem({ insight }: { insight: Insight }) {
  const Icon = iconMap[insight.type]
  const router = useRouter()
  
  const handleAction = () => {
    if (insight.action?.href) {
      router.push(insight.action.href)
    }
  }
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={cn('p-2 rounded-lg', colorMap[insight.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{insight.title}</h4>
        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
        {insight.action && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs"
            onClick={handleAction}
          >
            {insight.action.label}
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    generateInsights()
    
    // Setup realtime subscription for dynamic insights
    const channel = supabase
      .channel('insights-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'deadlines' },
        () => generateInsights()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const generateInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch data for insights
      const { data: deadlines, error } = await supabase
        .from('deadlines')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

      if (error) throw error

      const now = new Date()
      const insights: Insight[] = []

      // Check for overdue deadlines
      const overdue = deadlines?.filter(d => 
        d.status === 'pending' && new Date(d.due_date) < now
      ) || []

      if (overdue.length > 0) {
        insights.push({
          id: '1',
          type: 'urgent',
          title: `${overdue.length} scadenz${overdue.length === 1 ? 'a' : 'e'} non rispettat${overdue.length === 1 ? 'a' : 'e'}`,
          description: `Hai ${overdue.length} scadenz${overdue.length === 1 ? 'a' : 'e'} scadut${overdue.length === 1 ? 'a' : 'e'} che richiede${overdue.length === 1 ? '' : 'ono'} attenzione immediata.`,
          action: {
            label: 'Visualizza scadenze',
            href: '/dashboard/scadenze?filter=overdue'
          },
          priority: 1
        })
      }

      // Check for upcoming deadlines (next 7 days)
      const upcoming = deadlines?.filter(d => {
        const dueDate = new Date(d.due_date)
        const daysUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return d.status === 'pending' && daysUntil >= 0 && daysUntil <= 7
      }) || []

      if (upcoming.length > 0) {
        insights.push({
          id: '2',
          type: 'warning',
          title: `${upcoming.length} scadenz${upcoming.length === 1 ? 'a' : 'e'} nei prossimi 7 giorni`,
          description: 'Pianifica il tuo tempo per completare queste attività.',
          action: {
            label: 'Pianifica ora',
            href: '/dashboard/scadenze/calendar'
          },
          priority: 2
        })
      }

      // Productivity trend
      const completedThisMonth = deadlines?.filter(d => {
        if (d.status !== 'completed') return false
        const updatedDate = new Date(d.updated_at)
        return updatedDate.getMonth() === now.getMonth() && 
               updatedDate.getFullYear() === now.getFullYear()
      }).length || 0

      const completedLastMonth = deadlines?.filter(d => {
        if (d.status !== 'completed') return false
        const updatedDate = new Date(d.updated_at)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return updatedDate.getMonth() === lastMonth.getMonth() && 
               updatedDate.getFullYear() === lastMonth.getFullYear()
      }).length || 0

      if (completedThisMonth > 0 || completedLastMonth > 0) {
        const trend = completedThisMonth >= completedLastMonth ? 'positivo' : 'in calo'
        insights.push({
          id: '3',
          type: 'trend',
          title: `Trend produttività ${trend}`,
          description: `Hai completato ${completedThisMonth} scadenz${completedThisMonth === 1 ? 'a' : 'e'} questo mese${completedLastMonth > 0 ? ` (vs ${completedLastMonth} il mese scorso)` : ''}.`,
          priority: 3
        })
      }

      // Productivity tip
      const hasKanbanView = deadlines && deadlines.length > 5
      insights.push({
        id: '4',
        type: 'tip',
        title: 'Suggerimento produttività',
        description: hasKanbanView
          ? 'Prova la vista Kanban per organizzare meglio il tuo workflow.'
          : 'Aggiungi più scadenze per sbloccare visualizzazioni avanzate.',
        action: hasKanbanView ? {
          label: 'Vai a Kanban',
          href: '/dashboard/scadenze/kanban'
        } : undefined,
        priority: 4
      })

      // Sort by priority and limit to 4
      insights.sort((a, b) => a.priority - b.priority)
      setInsights(insights.slice(0, 4))
    } catch (error) {
      console.error('Error generating insights:', error)
      // Set fallback insights on error
      setInsights([{
        id: 'fallback',
        type: 'tip',
        title: 'Benvenuto!',
        description: 'Inizia aggiungendo i tuoi clienti e le scadenze per vedere insights personalizzati.',
        priority: 1
      }])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
            <CardTitle className="text-blue-900">AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/50 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-white/50 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-white/50 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">AI Insights</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {insights.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">
            Tutto sotto controllo! Nessun suggerimento al momento.
          </p>
        ) : (
          insights.map(insight => (
            <InsightItem key={insight.id} insight={insight} />
          ))
        )}
      </CardContent>
    </Card>
  )
}