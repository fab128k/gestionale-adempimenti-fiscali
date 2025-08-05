import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import { Toaster } from '@/components/ui/toaster'
import { SupabaseProvider } from '@/components/providers/supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gestionale Adempimenti Fiscali',
  description: 'Piattaforma professionale per la gestione delle scadenze fiscali',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
          {/* <Toaster /> */}
        </SupabaseProvider>
      </body>
    </html>
  )
}
