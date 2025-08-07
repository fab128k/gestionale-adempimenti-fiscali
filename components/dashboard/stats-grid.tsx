// ============================================
// 1. STATS GRID COMPONENT
// components/dashboard/stats-grid.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, AlertCircle, CheckCircle, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ElementType
  color: 'blue' | 'orange' | 'red' | 'green' | 'purple' | 'gray'
  trend?: 'up' | 'down' | 'neutral'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200'
}

function StatCard({ title, value, change, icon: Icon, color, trend }: StatCardProps) {
  return (
    <Card className={cn('border-2 hover:shadow-lg transition-all duration-200', colorMap[color])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            <p className="text-xs opacity-70">{change}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsGrid() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
    clients: 0,
    thisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchStats()
    
    // Setup realtime subscription
    const channel = supabase
      .channel('stats-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'deadlines' },
        () => fetchStats()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all stats in parallel
      const [deadlines, clients] = await Promise.all([
        supabase.from('deadlines').select('*').eq('user_id', user.id),
        supabase.from('clients').select('count').eq('user_id', user.id)
      ])

      const now = new Date()
      const stats = {
        total: deadlines.data?.length || 0,
        pending: deadlines.data?.filter(d => d.status === 'pending').length || 0,
        overdue: deadlines.data?.filter(d => 
          d.status === 'pending' && new Date(d.due_date) < now
        ).length || 0,
        completed: deadlines.data?.filter(d => d.status === 'completed').length || 0,
        clients: clients.data?.[0]?.count || 0,
        thisMonth: deadlines.data?.filter(d => {
          const dueDate = new Date(d.due_date)
          return dueDate.getMonth() === now.getMonth() && 
                 dueDate.getFullYear() === now.getFullYear()
        }).length || 0
      }

      setStats(stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="h-32 bg-gray-100" />
      ))}
    </div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        title="Scadenze Totali"
        value={stats.total}
        icon={FileText}
        color="blue"
      />
      <StatCard
        title="In Attesa"
        value={stats.pending}
        icon={Clock}
        color="orange"
        change={`${stats.pending} da completare`}
      />
      <StatCard
        title="Scadute"
        value={stats.overdue}
        icon={AlertCircle}
        color="red"
        change={stats.overdue > 0 ? 'Richiede attenzione' : 'Tutto ok'}
        trend={stats.overdue > 0 ? 'up' : 'neutral'}
      />
      <StatCard
        title="Completate"
        value={stats.completed}
        icon={CheckCircle}
        color="green"
        change={`${Math.round((stats.completed / stats.total) * 100) || 0}% del totale`}
      />
      <StatCard
        title="Clienti"
        value={stats.clients}
        icon={Users}
        color="purple"
      />
      <StatCard
        title="Questo Mese"
        value={stats.thisMonth}
        icon={TrendingUp}
        color="gray"
        change="Scadenze mensili"
      />
    </div>
  )
}
