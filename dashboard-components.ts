// ===== components/layout/sidebar.tsx =====
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FileText,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Store,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Clienti', href: '/dashboard/clienti', icon: Users },
  { name: 'Scadenze', href: '/dashboard/scadenze', icon: FileText },
  { name: 'Calendario', href: '/dashboard/scadenze/calendar', icon: Calendar },
  { name: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
  { name: 'Impostazioni', href: '/dashboard/impostazioni', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  
  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary-600" />
            <span className="font-semibold text-gray-900">GestiFiscal</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-primary-50 text-primary-700" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>
      
      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700">U</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User Name</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ===== components/layout/header.tsx =====
'use client'

import { Bell, Search, Plus } from 'lucide-react'
import { CommandPalette } from '@/components/command-palette'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Cerca clienti, scadenze... (⌘K)"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            readOnly
            onClick={() => {
              // Trigger command palette
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: true
              })
              document.dispatchEvent(event)
            }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuova Scadenza
        </Button>
        
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
      
      <CommandPalette />
    </header>
  )
}

// ===== components/dashboard/stats-grid.tsx =====
'use client'

import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'orange' | 'green' | 'red'
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600'
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : null}
              <span className={cn(
                "text-sm",
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              )}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}

export function StatsGrid() {
  // In produzione questi dati verranno da Supabase con useRealtimeStats()
  const stats = {
    total: 156,
    upcoming: 23,
    completed: 108,
    overdue: 5,
    completionRate: 85
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Scadenze Totali"
        value={stats.total}
        change="+12% dal mese scorso"
        trend="up"
        icon={FileText}
        color="blue"
      />
      <StatCard
        title="In Scadenza"
        value={stats.upcoming}
        change="Prossimi 7 giorni"
        icon={Clock}
        color="orange"
      />
      <StatCard
        title="Completate"
        value={stats.completed}
        change={`${stats.completionRate}% completion rate`}
        trend="up"
        icon={CheckCircle}
        color="green"
      />
      <StatCard
        title="Scadute"
        value={stats.overdue}
        change="Richiede attenzione"
        icon={AlertCircle}
        color="red"
      />
    </div>
  )
}

// ===== components/dashboard/ai-insights-panel.tsx =====
'use client'

import { Zap, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Insight {
  id: string
  type: 'tip' | 'warning' | 'trend'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

function InsightItem({ insight }: { insight: Insight }) {
  const icons = {
    tip: Lightbulb,
    warning: AlertTriangle,
    trend: TrendingUp
  }
  
  const colors = {
    tip: 'text-blue-600 bg-blue-50',
    warning: 'text-orange-600 bg-orange-50',
    trend: 'text-green-600 bg-green-50'
  }
  
  const Icon = icons[insight.type]
  
  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`p-2 rounded-lg ${colors[insight.type]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
        <p className="text-sm text-gray-600 mt-0.5">{insight.description}</p>
        {insight.action && (
          <button
            onClick={insight.action.onClick}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1"
          >
            {insight.action.label} →
          </button>
        )}
      </div>
    </div>
  )
}

export function AIInsightsPanel() {
  // In produzione questi dati verranno da useAIInsights()
  const insights: Insight[] = [
    {
      id: '1',
      type: 'warning',
      title: '3 scadenze critiche',
      description: 'Hai 3 F24 in scadenza entro 48 ore',
      action: {
        label: 'Visualizza',
        onClick: () => console.log('Navigate to deadlines')
      }
    },
    {
      id: '2',
      type: 'trend',
      title: 'Efficienza migliorata',
      description: 'Hai completato il 20% di scadenze in più questo mese',
    },
    {
      id: '3',
      type: 'tip',
      title: 'Automatizza i promemoria',
      description: 'Attiva WhatsApp per inviare reminder automatici ai clienti',
      action: {
        label: 'Configura',
        onClick: () => console.log('Navigate to settings')
      }
    }
  ]
  
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Zap className="h-5 w-5 text-blue-600" />
        </div>
        <CardTitle className="text-lg">AI Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {insights.map(insight => (
          <InsightItem key={insight.id} insight={insight} />
        ))}
      </CardContent>
    </Card>
  )
}

// ===== components/dashboard/quick-actions.tsx =====
'use client'

import { Plus, Upload, Users, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const actions = [
  {
    label: 'Nuova Scadenza',
    icon: Plus,
    onClick: () => console.log('New deadline'),
    color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
  },
  {
    label: 'Importa Excel',
    icon: Upload,
    onClick: () => console.log('Import Excel'),
    color: 'text-green-600 bg-green-50 hover:bg-green-100'
  },
  {
    label: 'Nuovo Cliente',
    icon: Users,
    onClick: () => console.log('New client'),
    color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
  },
  {
    label: 'Report Mensile',
    icon: FileText,
    onClick: () => console.log('Monthly report'),
    color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Azioni Rapide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${action.color}`}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== components/dashboard/recent-deadlines.tsx =====
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface Deadline {
  id: string
  client: string
  type: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

const mockDeadlines: Deadline[] = [
  {
    id: '1',
    client: 'Mario Rossi SRL',
    type: 'F24 IVA Trimestrale',
    dueDate: '2024-12-20',
    status: 'pending',
    priority: 'urgent'
  },
  {
    id: '2',
    client: 'Tech Solutions SPA',
    type: 'Dichiarazione Redditi',
    dueDate: '2024-12-31',
    status: 'pending',
    priority: 'high'
  },
  // Altri esempi...
]

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
}

export function RecentDeadlines() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scadenze Recenti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockDeadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{deadline.client}</h4>
                <p className="text-sm text-gray-600 mt-1">{deadline.type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Scadenza: {formatDate(deadline.dueDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[deadline.priority]}>
                  {deadline.priority}
                </Badge>
                <Badge className={statusColors[deadline.status]}>
                  {deadline.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}