// ===== CONFIGURAZIONE SUPABASE GITHUB AUTH =====

// 1. SETUP IN SUPABASE DASHBOARD
/*
1. Vai su Supabase Dashboard → Authentication → Providers
2. Abilita "GitHub" provider
3. Copia il "Callback URL" (sarà tipo: https://[your-project].supabase.co/auth/v1/callback)
4. Vai su GitHub.com → Settings → Developer settings → OAuth Apps
5. Clicca "New OAuth App"
6. Configura:
   - Application name: Gestionale Fiscale
   - Homepage URL: http://localhost:3000 (in dev) o tuo dominio
   - Authorization callback URL: [incolla il Callback URL da Supabase]
7. Dopo la creazione, copia:
   - Client ID
   - Client Secret (genera uno nuovo)
8. Torna su Supabase e incolla Client ID e Client Secret
9. Salva
*/

// ===== app/auth/login/page.tsx - VERSIONE AGGIORNATA CON GITHUB =====
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FileText, Loader2, Github, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authMethod, setAuthMethod] = useState<'github' | 'email' | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  // Login con GitHub
  const handleGitHubLogin = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'accesso con GitHub",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Login con Email/Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        
        if (error) throw error
        
        toast({
          title: "Registrazione completata!",
          description: "Controlla la tua email per confermare l'account.",
        })
        setAuthMethod(null)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Magic Link
  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: "Email richiesta",
        description: "Inserisci la tua email per ricevere il link magico",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      
      if (error) throw error
      
      toast({
        title: "Link inviato!",
        description: "Controlla la tua email per accedere.",
      })
      setAuthMethod(null)
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Se non ha scelto un metodo di autenticazione
  if (!authMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-primary-600" />
            </div>
            <CardTitle className="text-2xl text-center">
              Accedi al Gestionale
            </CardTitle>
            <CardDescription className="text-center">
              Scegli il tuo metodo di accesso preferito
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button
              variant="default"
              className="w-full"
              size="lg"
              onClick={handleGitHubLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Github className="mr-2 h-5 w-5" />
              )}
              Continua con GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Oppure
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => setAuthMethod('email')}
            >
              <Mail className="mr-2 h-5 w-5" />
              Continua con Email
            </Button>
          </CardContent>
          
          <CardFooter>
            <p className="text-center text-sm text-gray-600 w-full">
              Accedendo, accetti i nostri{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                Termini di Servizio
              </Link>{' '}
              e la{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Form email/password
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAuthMethod(null)}
            className="w-fit"
          >
            ← Indietro
          </Button>
          <CardTitle className="text-2xl">
            {isSignUp ? 'Crea il tuo account' : 'Accedi con email'}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Inserisci i tuoi dati per registrarti' 
              : 'Inserisci le tue credenziali per accedere'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleEmailAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@studio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
              />
            </div>
            
            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <Link href="/auth/reset-password" className="text-primary-600 hover:text-primary-500">
                  Password dimenticata?
                </Link>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="text-primary-600"
                >
                  Usa Magic Link
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Registrati' : 'Accedi'}
            </Button>
            
            <p className="text-center text-sm text-gray-600">
              {isSignUp ? 'Hai già un account?' : 'Non hai un account?'}{' '}
              <button
                type="button"
                className="text-primary-600 hover:text-primary-500 font-medium"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Accedi' : 'Registrati'}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

// ===== components/ui/separator.tsx =====
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

// ===== components/auth/auth-provider.tsx =====
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { Session, User } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // Se l'utente è autenticato ma non ha completato il setup
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('studio_name')
            .eq('id', session.user.id)
            .single()
          
          if (!profile?.studio_name) {
            router.push('/auth/onboarding')
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        router.refresh()
        
        if (event === 'SIGNED_IN') {
          router.push('/dashboard')
        } else if (event === 'SIGNED_OUT') {
          router.push('/auth/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ===== app/auth/onboarding/page.tsx =====
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

export default function OnboardingPage() {
  const [studioName, setStudioName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non autenticato')

      // Crea o aggiorna il profilo utente
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          studio_name: studioName,
          plan: 'free',
          preferences: {
            theme: 'light',
            defaultView: 'kanban'
          }
        })

      if (error) throw error

      toast({
        title: "Benvenuto!",
        description: "Il tuo studio è stato configurato con successo.",
      })

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Si è verificato un errore",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary-600" />
          </div>
          <CardTitle className="text-2xl text-center">
            Configura il tuo Studio
          </CardTitle>
          <CardDescription className="text-center">
            Un ultimo passaggio per iniziare
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studioName">Nome dello Studio</Label>
              <Input
                id="studioName"
                type="text"
                placeholder="Studio Rossi & Associati"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                required
                disabled={loading}
                minLength={3}
              />
              <p className="text-sm text-gray-500">
                Questo nome apparirà nei tuoi documenti e comunicazioni
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !studioName.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Completa Configurazione
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

// ===== middleware.ts (nella root del progetto) =====
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Se l'utente non è autenticato e sta cercando di accedere a pagine protette
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Se l'utente è autenticato e sta cercando di accedere alle pagine auth
  if (session && req.nextUrl.pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}