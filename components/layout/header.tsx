// ============================================
// 2. HEADER COMPONENT
// components/layout/header.tsx
// ============================================

'use client'

import { CommandPalette } from '@/components/dashboard/command-palette'
import { Button } from '@/components/ui/button'
import { Bell, MessageSquare, HelpCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function Header() {
  const [notifications, setNotifications] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      
      setNotifications(count || 0)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <CommandPalette />
      </div>

      <div className="flex items-center gap-2">
        {/* WhatsApp Widget */}
        <Button variant="ghost" size="sm" className="relative">
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Button>

        {/* Help */}
        <Button variant="ghost" size="sm">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
