// ============================================
// 1. SIDEBAR COMPONENT
// components/layout/sidebar.tsx
// ============================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  Store,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Kanban,
  LayoutGrid,
  Clock
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Scadenze',
    href: '/dashboard/scadenze',
    icon: Clock,
    children: [
      { name: 'Vista Griglia', href: '/dashboard/scadenze/grid', icon: LayoutGrid },
      { name: 'Vista Kanban', href: '/dashboard/scadenze/kanban', icon: Kanban },
      { name: 'Calendario', href: '/dashboard/scadenze/calendar', icon: Calendar }
    ]
  },
  {
    name: 'Clienti',
    href: '/dashboard/clienti',
    icon: Users
  },
  {
    name: 'Documenti',
    href: '/dashboard/documenti',
    icon: FileText
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    name: 'Marketplace',
    href: '/dashboard/marketplace',
    icon: Store
  },
  {
    name: 'Impostazioni',
    href: '/dashboard/impostazioni',
    icon: Settings
  }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-full',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GF</span>
            </div>
            <span className="font-semibold text-gray-900">Gestionale Fiscale</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && 'mx-auto')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const isExpanded = expandedItems.includes(item.name)
          const Icon = item.icon

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                onClick={(e) => {
                  if (item.children) {
                    e.preventDefault()
                    toggleExpanded(item.name)
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.children && (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    )}
                  </>
                )}
              </Link>

              {/* Children items */}
              {!collapsed && item.children && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon
                    const childActive = pathname === child.href
                    
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                          childActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        <ChildIcon className="h-4 w-4" />
                        <span>{child.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Studio Example
              </p>
              <p className="text-xs text-gray-500 truncate">
                Piano Pro
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
