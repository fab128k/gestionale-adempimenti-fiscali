// ============================================
// 3. COMMAND PALETTE - VERSIONE CORRETTA
// components/dashboard/command-palette.tsx
// ============================================

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
  LayoutGrid,
  Kanban,
  LogOut,
  Home,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react'

interface QuickSearchResult {
  id: string
  type: 'client' | 'deadline'
  title: string
  subtitle?: string
  href: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<QuickSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      // Additional shortcuts
      if (!open && (e.metaKey || e.ctrlKey)) {
        switch(e.key) {
          case 'n':
            if (e.shiftKey) {
              e.preventDefault()
              router.push('/dashboard/scadenze/new')
            }
            break
          case 'c':
            if (e.shiftKey) {
              e.preventDefault()
              router.push('/dashboard/clienti/new')
            }
            break
        }
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, router])

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Search clients and deadlines in parallel
      const [clientsResult, deadlinesResult] = await Promise.all([
        supabase
          .from('clients')
          .select('id, denominazione, codice_fiscale, partita_iva')
          .eq('user_id', user.id)
          .or(`denominazione.ilike.%${query}%,codice_fiscale.ilike.%${query}%,partita_iva.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('deadlines')
          .select('id, type, description, due_date, client:clients(denominazione)')
          .eq('user_id', user.id)
          .or(`type.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5)
      ])

      const results: QuickSearchResult[] = []

      // Add client results
      clientsResult.data?.forEach(client => {
        results.push({
          id: client.id,
          type: 'client',
          title: client.denominazione,
          subtitle: client.codice_fiscale || client.partita_iva,
          href: `/dashboard/clienti/${client.id}`
        })
      })

      // Add deadline results
      deadlinesResult.data?.forEach(deadline => {
        results.push({
          id: deadline.id,
          type: 'deadline',
          title: deadline.type,
          subtitle: `${deadline.client?.denominazione} - ${new Date(deadline.due_date).toLocaleDateString('it-IT')}`,
          href: `/dashboard/scadenze/${deadline.id}`
        })
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }, [supabase])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    setSearchQuery('')
    setSearchResults([])
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
        <CommandInput 
          placeholder="Cosa vuoi fare?" 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? 'Ricerca in corso...' : 'Nessun risultato trovato.'}
          </CommandEmpty>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <>
              <CommandGroup heading="Risultati Ricerca">
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => runCommand(() => router.push(result.href))}
                  >
                    {result.type === 'client' ? (
                      <Users className="mr-2 h-4 w-4" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-gray-500">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          
          {/* Quick Actions */}
          <CommandGroup heading="Azioni Rapide">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze/new'))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Nuova Scadenza</span>
              <kbd className="ml-auto text-xs">⇧⌘N</kbd>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/clienti/new'))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Nuovo Cliente</span>
              <kbd className="ml-auto text-xs">⇧⌘C</kbd>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* Navigation */}
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
          
          {/* Views */}
          <CommandGroup heading="Viste Rapide">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze?filter=overdue'))}>
              <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              Scadenze Scadute
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze?filter=upcoming'))}>
              <Clock className="mr-2 h-4 w-4 text-orange-500" />
              Prossime 7 Giorni
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/scadenze?filter=completed'))}>
              <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
              Completate
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          {/* System */}
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