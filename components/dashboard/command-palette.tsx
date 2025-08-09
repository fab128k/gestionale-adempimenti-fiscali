// components/dashboard/command-palette.tsx
// VERSIONE SEMPLIFICATA SENZA RICERCA

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Plus,
  Search,
  Calendar,
  Users,
  Settings,
  FileText,
  LayoutDashboard,
  Kanban,
  LogOut,
  Home,
  Clock,
  AlertCircle
} from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Cerca...</span>
        <kbd className="hidden md:inline ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cosa vuoi fare?" />
        <CommandList>
          <CommandEmpty>Nessun risultato trovato.</CommandEmpty>
          
          <CommandGroup heading="Azioni Rapide">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze/new'))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Nuova Scadenza</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/clienti/new'))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Nuovo Cliente</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Navigazione">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze'))}>
              <FileText className="mr-2 h-4 w-4" />
              Scadenze
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze/kanban'))}>
              <Kanban className="mr-2 h-4 w-4" />
              Vista Kanban
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze/calendar'))}>
              <Calendar className="mr-2 h-4 w-4" />
              Calendario
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/clienti'))}>
              <Users className="mr-2 h-4 w-4" />
              Clienti
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Viste Rapide">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze?filter=overdue'))}>
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              Scadenze Scadute
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze?filter=upcoming'))}>
              <Clock className="mr-2 h-4 w-4 text-orange-500" />
              Prossime 7 Giorni
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Sistema">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/impostazioni'))}>
              <Settings className="mr-2 h-4 w-4" />
              Impostazioni
            </CommandItem>
            <CommandItem onSelect={() => runCommand(handleLogout)}>
              <LogOut className="mr-2 h-4 w-4" />
              Esci
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
