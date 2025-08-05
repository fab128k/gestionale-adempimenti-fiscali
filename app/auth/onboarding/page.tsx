'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Building2, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [studioName, setStudioName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

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

      alert('Benvenuto! Il tuo studio è stato configurato con successo.')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Errore:', error)
      alert('Errore: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configura il tuo Studio
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Un ultimo passaggio per iniziare
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="studioName" className="block text-sm font-medium text-gray-700">
              Nome dello Studio
            </label>
            <input
              id="studioName"
              type="text"
              required
              minLength={3}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Studio Rossi & Associati"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Questo nome apparirà nei tuoi documenti e comunicazioni
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !studioName.trim()}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Completa Configurazione
          </button>
        </form>
      </div>
    </div>
  )
}
