// ============================================
// 3. COMMAND PALETTE
// components/dashboard/command-palette.tsx
// ============================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  LayoutGrid,
  Kanban,
  LogOut
} from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

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

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
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
              Nuova Scadenza
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/clienti/new'))}>
              <Users className="mr-2 h-4 w-4" />
              Nuovo Cliente
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigazione">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Dashboard
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
          <CommandGroup heading="Sistema">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/impostazioni'))}>
              <Settings className="mr-2 h-4 w-4" />
              Impostazioni
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => {
              // Logout logic
              window.location.href = '/auth/logout'
            })}>
              <LogOut className="mr-2 h-4 w-4" />
              Esci
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}