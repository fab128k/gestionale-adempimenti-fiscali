#!/bin/bash

# =========================================================================
# Script di Migrazione: Vite + React → Next.js 14 + Supabase + Smart Dashboard
# =========================================================================
# Versione: 1.0.0
# Data: $(date +%Y-%m-%d)
# Autore: Migration Tool
# =========================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="../gestionale-backup-${TIMESTAMP}"
PROJECT_NAME="gestionale-adempimenti-fiscali"
CURRENT_DIR=$(pwd)

# =========================================================================
# FUNZIONI UTILITY
# =========================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    read -p "$1 (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

check_prerequisites() {
    log_info "Verifico prerequisiti..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js non trovato. Installa Node.js 18+ prima di continuare."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm non trovato. Installa npm prima di continuare."
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_warning "Git non trovato. Il backup Git non sarà disponibile."
    fi
    
    # Check if in correct directory
    if [ ! -f "package.json" ]; then
        log_error "package.json non trovato. Assicurati di essere nella root del progetto."
        exit 1
    fi
    
    log_success "Prerequisiti verificati!"
}

# =========================================================================
# FASE 1: BACKUP COMPLETO
# =========================================================================

create_backup() {
    log_info "Creazione backup completo in ${BACKUP_DIR}..."
    
    # Crea directory di backup
    mkdir -p "${BACKUP_DIR}"
    
    # Copia tutti i file (escluso node_modules)
    rsync -av --progress \
        --exclude 'node_modules' \
        --exclude '.next' \
        --exclude 'dist' \
        --exclude '.git' \
        "${CURRENT_DIR}/" "${BACKUP_DIR}/"
    
    # Backup anche del .git se esiste
    if [ -d ".git" ]; then
        log_info "Backup della history Git..."
        cp -r .git "${BACKUP_DIR}/.git-backup"
    fi
    
    # Crea file di info backup
    cat > "${BACKUP_DIR}/backup-info.txt" << EOF
Backup creato: ${TIMESTAMP}
Directory originale: ${CURRENT_DIR}
Versione package.json: $(grep '"version"' package.json | head -1)
EOF
    
    log_success "Backup completato in ${BACKUP_DIR}"
}

# =========================================================================
# FASE 2: SALVATAGGIO CODICE ESISTENTE
# =========================================================================

preserve_existing_code() {
    log_info "Preservo il codice esistente..."
    
    # Crea directory temporanea per il codice da preservare
    mkdir -p .migration-temp/components
    mkdir -p .migration-temp/styles
    mkdir -p .migration-temp/assets
    
    # Salva componenti React esistenti
    if [ -d "src/components" ]; then
        cp -r src/components/* .migration-temp/components/ 2>/dev/null || true
    fi
    
    # Salva stili
    if [ -f "src/index.css" ]; then
        cp src/index.css .migration-temp/styles/
    fi
    
    # Salva asset pubblici
    if [ -d "public" ]; then
        cp -r public/* .migration-temp/assets/ 2>/dev/null || true
    fi
    
    # Salva configurazioni personalizzate Tailwind
    if [ -f "tailwind.config.js" ]; then
        cp tailwind.config.js .migration-temp/tailwind.config.old.js
    fi
    
    log_success "Codice esistente preservato"
}

# =========================================================================
# FASE 3: SETUP NEXT.JS
# =========================================================================

setup_nextjs() {
    log_info "Inizializzo progetto Next.js 14..."
    
    # Crea nuovo package.json
    cat > package.json << 'EOF'
{
  "name": "gestionale-adempimenti-fiscali",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "setup-db": "node scripts/setup-database.js",
    "generate-types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/database.types.ts"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/ssr": "^0.3.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.263.1",
    "framer-motion": "^11.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "@hello-pangea/dnd": "^16.5.0",
    "date-fns": "^3.3.0",
    "recharts": "^2.12.0",
    "cmdk": "^0.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.11.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.2.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "tailwindcss-animate": "^1.0.7"
  }
}
EOF
    
    # Crea tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
    
    # Crea next.config.js
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  // Se devi deployare su GitHub Pages, decommenta:
  // output: 'export',
  // basePath: '/gestionale-adempimenti-fiscali',
}

module.exports = nextConfig
EOF
    
    # Crea .eslintrc.json
    cat > .eslintrc.json << 'EOF'
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
EOF
    
    log_success "Configurazione Next.js completata"
}

# =========================================================================
# FASE 4: CREAZIONE STRUTTURA DIRECTORY
# =========================================================================

create_directory_structure() {
    log_info "Creo la struttura delle directory..."
    
    # App directory (Next.js 14 App Router)
    mkdir -p app/{auth,dashboard,api}
    mkdir -p app/auth/{login,onboarding}
    mkdir -p app/dashboard/{clienti,scadenze,marketplace,impostazioni,analytics}
    mkdir -p app/dashboard/clienti/\[id\]
    mkdir -p app/dashboard/scadenze/{kanban,calendar,grid}
    mkdir -p app/api/webhooks/whatsapp
    
    # Components
    mkdir -p components/{layout,dashboard,deadlines,clients,ai,marketplace,ui}
    
    # Lib & Utils
    mkdir -p lib
    mkdir -p hooks
    mkdir -p types
    
    # Supabase
    mkdir -p supabase/{migrations,functions}
    
    # Public assets
    mkdir -p public/{images,fonts}
    
    # Scripts
    mkdir -p scripts
    
    log_success "Struttura directory creata"
}

# =========================================================================
# FASE 5: CREAZIONE FILE BASE
# =========================================================================

create_base_files() {
    log_info "Creo file base dell'applicazione..."
    
    # Layout root
    cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
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
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  )
}
EOF
    
    # Global CSS
    cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 217.2 91.2% 59.8%;
    --radius: 0.5rem;
  }
}

@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
EOF
    
    # Home page
    cat > app/page.tsx << 'EOF'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/auth/login')
  }
}
EOF
    
    # Dashboard layout
    cat > app/dashboard/layout.tsx << 'EOF'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
EOF
    
    # Dashboard page
    cat > app/dashboard/page.tsx << 'EOF'
'use client'

import { StatsGrid } from '@/components/dashboard/stats-grid'
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentDeadlines } from '@/components/dashboard/recent-deadlines'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Benvenuto nel tuo gestionale fiscale</p>
      </div>
      
      <StatsGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentDeadlines />
        </div>
        <div className="space-y-6">
          <AIInsightsPanel />
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
EOF
    
    # Configurazione Tailwind
    cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
EOF
    
    # PostCSS config
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    
    # Environment variables template
    cat > .env.local.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Cloud (Phase 2+)
# GOOGLE_CLOUD_PROJECT_ID=
# GOOGLE_APPLICATION_CREDENTIALS=

# WhatsApp Business API (Phase 2+)
# WHATSAPP_API_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
EOF
    
    # Gitignore
    cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# migration temp
.migration-temp/

# IDE
.vscode/
.idea/
EOF
    
    log_success "File base creati"
}

# =========================================================================
# FASE 6: SETUP COMPONENTI SMART DASHBOARD
# =========================================================================

create_smart_dashboard_components() {
    log_info "Creo componenti Smart Dashboard..."
    
    # Design System
    cat > lib/design-system.ts << 'EOF'
export const designSystem = {
  colors: {
    primary: { 
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444'
    }
  },
  
  components: {
    card: 'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow',
    button: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 rounded-lg px-4 py-2',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-2',
      ghost: 'hover:bg-gray-100 rounded-lg px-4 py-2'
    },
    badge: {
      urgent: 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs',
      warning: 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs',
      success: 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs'
    }
  },
  
  animations: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    smooth: 'transition-all duration-200 ease-in-out'
  }
}
EOF
    
    # Supabase client
    cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
EOF
    
    # Utils
    cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}
EOF
    
    # Types base
    cat > types/app.types.ts << 'EOF'
export interface User {
  id: string
  email: string
  studioName?: string
  plan: 'free' | 'pro' | 'enterprise'
  preferences: {
    theme: 'light' | 'dark'
    defaultView: 'kanban' | 'grid' | 'calendar'
  }
}

export interface Client {
  id: string
  userId: string
  denominazione: string
  tipo: 'persona_fisica' | 'societa' | 'altro'
  codiceFiscale?: string
  partitaIva?: string
  email?: string
  pec?: string
  telefono?: string
  whatsappEnabled: boolean
  metadata: Record<string, any>
  createdAt: string
}

export interface Deadline {
  id: string
  userId: string
  clientId: string
  client?: Client
  type: string
  description?: string
  amount?: number
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignedTo?: string
  completedAt?: string
  createdAt: string
}

export type ViewType = 'kanban' | 'grid' | 'calendar'
EOF
    
    # Provider Supabase
    mkdir -p components/providers
    cat > components/providers/supabase-provider.tsx << 'EOF'
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

type SupabaseContext = {
  supabase: SupabaseClient
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient())
  const router = useRouter()
  
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      }
      router.refresh()
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])
  
  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('useSupabase deve essere usato dentro SupabaseProvider')
  }
  return context
}
EOF
    
    log_success "Componenti Smart Dashboard creati"
}

# =========================================================================
# FASE 7: SETUP SUPABASE
# =========================================================================

setup_supabase() {
    log_info "Setup configurazione Supabase..."
    
    # Schema database iniziale
    cat > supabase/migrations/001_initial_schema.sql << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT auth.uid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    studio_name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    preferences JSONB DEFAULT '{"theme": "light", "defaultView": "kanban"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    denominazione TEXT NOT NULL,
    tipo TEXT CHECK (tipo IN ('persona_fisica', 'societa', 'altro')),
    codice_fiscale TEXT,
    partita_iva TEXT,
    indirizzo TEXT,
    cap TEXT,
    citta TEXT,
    provincia TEXT,
    email TEXT,
    pec TEXT,
    telefono TEXT,
    whatsapp_enabled BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, codice_fiscale),
    UNIQUE(user_id, partita_iva)
);

-- Deadlines table
CREATE TABLE deadlines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table (for marketplace)
CREATE TABLE templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    content JSONB NOT NULL,
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    action_url TEXT,
    priority TEXT DEFAULT 'normal',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_deadlines_user_status ON deadlines(user_id, status);
CREATE INDEX idx_deadlines_due_date ON deadlines(user_id, due_date);
CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
    
CREATE POLICY "Users can view own clients" ON clients
    FOR ALL USING (auth.uid() = user_id);
    
CREATE POLICY "Users can manage own deadlines" ON deadlines
    FOR ALL USING (auth.uid() = user_id);
    
CREATE POLICY "Users can view all templates" ON templates
    FOR SELECT USING (true);
    
CREATE POLICY "Users can create templates" ON templates
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
    
CREATE POLICY "Users can update own templates" ON templates
    FOR UPDATE USING (auth.uid() = creator_id);
    
CREATE POLICY "Users can view own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON deadlines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EOF
    
    # Setup script per database
    cat > scripts/setup-database.js << 'EOF'
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  try {
    console.log('Setting up database...')
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql')
    const migration = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migration })
    
    if (error) {
      console.error('Migration error:', error)
      process.exit(1)
    }
    
    console.log('Database setup completed successfully!')
  } catch (error) {
    console.error('Setup error:', error)
    process.exit(1)
  }
}

setupDatabase()
EOF
    
    log_success "Configurazione Supabase completata"
}

# =========================================================================
# FASE 8: MIGRAZIONE COMPONENTI ESISTENTI
# =========================================================================

migrate_existing_components() {
    log_info "Migro i componenti esistenti..."
    
    # Se esiste il componente GestionaleAdempimenti
    if [ -f ".migration-temp/components/GestionaleAdempimenti.jsx" ]; then
        log_info "Converto GestionaleAdempimenti.jsx in TypeScript modulare..."
        
        # Crea script di conversione
        cat > scripts/convert-component.js << 'EOF'
// Script per convertire il componente esistente
// Questo richiede analisi manuale del codice
console.log('Il componente GestionaleAdempimenti.jsx deve essere:')
console.log('1. Convertito in TypeScript')
console.log('2. Scomposto in componenti modulari')
console.log('3. Integrato con Supabase invece di localStorage')
console.log('4. Aggiornato con il nuovo design system')
console.log('')
console.log('Vedi la documentazione in docs/migration-guide.md')
EOF
        
        # Crea guida di migrazione
        mkdir -p docs
        cat > docs/migration-guide.md << 'EOF'
# Guida Migrazione Componenti

## Da localStorage a Supabase

### Prima (localStorage):
```javascript
useEffect(() => {
  const savedData = localStorage.getItem('data')
  if (savedData) {
    setState(JSON.parse(savedData))
  }
}, [])

const saveData = () => {
  localStorage.setItem('data', JSON.stringify(state))
}
```

### Dopo (Supabase):
```typescript
import { useSupabase } from '@/hooks/useSupabase'

const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', userId)

const saveData = async () => {
  const { error } = await supabase
    .from('clients')
    .upsert(clientData)
}
```

## Componenti da creare:

1. **ClientManager** - Gestione anagrafica clienti
2. **DeadlineGrid** - Visualizzazione scadenze
3. **KanbanBoard** - Vista Kanban
4. **CalendarView** - Vista calendario
5. **SheetManager** - Gestione fogli/categorie

Ogni componente deve:
- Usare TypeScript
- Implementare real-time con Supabase
- Seguire il design system
- Essere responsive
EOF
    fi
    
    # Copia stili esistenti
    if [ -f ".migration-temp/styles/index.css" ]; then
        log_info "Integro stili esistenti..."
        echo "" >> app/globals.css
        echo "/* === Stili migrati dal progetto precedente === */" >> app/globals.css
        cat .migration-temp/styles/index.css >> app/globals.css
    fi
    
    log_success "Migrazione componenti completata (richiede intervento manuale)"
}

# =========================================================================
# FASE 9: INSTALLAZIONE DIPENDENZE
# =========================================================================

install_dependencies() {
    log_info "Installo le dipendenze..."
    
    # Rimuovi node_modules esistenti
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    # Rimuovi lock files
    rm -f package-lock.json yarn.lock pnpm-lock.yaml
    
    # Installa con npm
    npm install
    
    log_success "Dipendenze installate"
}

# =========================================================================
# FASE 10: PULIZIA E FINALIZZAZIONE
# =========================================================================

cleanup_and_finalize() {
    log_info "Pulizia e finalizzazione..."
    
    # Rimuovi file vecchi di Vite
    rm -f vite.config.js index.html
    
    # Rimuovi vecchia struttura src se vuota
    if [ -d "src" ] && [ -z "$(ls -A src)" ]; then
        rmdir src
    fi
    
    # Crea README aggiornato
    cat > README.md << 'EOF'
# Gestionale Adempimenti Fiscali 2.0

Piattaforma SaaS moderna per la gestione delle scadenze fiscali basata su Next.js 14, Supabase e Smart Dashboard UI.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **UI Components**: Radix UI, shadcn/ui, Framer Motion
- **State Management**: React Hook Form, Zod validation
- **Deployment**: Vercel / Self-hosted

## 📦 Setup

1. **Configura Supabase**:
   - Crea un nuovo progetto su [Supabase](https://supabase.com)
   - Copia le credenziali in `.env.local`

2. **Installa dipendenze**:
   ```bash
   npm install
   ```

3. **Setup database**:
   ```bash
   npm run setup-db
   ```

4. **Avvia in development**:
   ```bash
   npm run dev
   ```

## 🏗️ Struttura Progetto

```
gestionale-adempimenti-fiscali/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route di autenticazione
│   ├── (dashboard)/       # Route dashboard protette
│   └── api/               # API routes
├── components/            # Componenti React
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # UI components
├── lib/                   # Utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── supabase/             # Database schema & migrations
```

## 🔧 Comandi Utili

- `npm run dev` - Avvia development server
- `npm run build` - Build di produzione
- `npm run type-check` - Type checking
- `npm run lint` - Linting

## 📝 Migrazione dal Vecchio Progetto

Vedi `docs/migration-guide.md` per dettagli sulla migrazione dei componenti esistenti.

## 🤝 Contributing

1. Fork il repository
2. Crea un feature branch
3. Commit le modifiche
4. Push al branch
5. Apri una Pull Request

## 📄 License

MIT License - vedi LICENSE per dettagli.
EOF
    
    # Rimuovi directory temporanea
    if [ -d ".migration-temp" ]; then
        rm -rf .migration-temp
    fi
    
    log_success "Pulizia completata"
}

# =========================================================================
# MAIN EXECUTION
# =========================================================================

main() {
    echo ""
    echo "=================================================="
    echo "  MIGRAZIONE VITE → NEXT.JS + SUPABASE"
    echo "=================================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Confirm migration
    echo "Questo script effettuerà le seguenti operazioni:"
    echo "1. Backup completo del progetto esistente"
    echo "2. Conversione a Next.js 14 con TypeScript"
    echo "3. Setup Supabase per backend"
    echo "4. Implementazione Smart Dashboard UI"
    echo "5. Migrazione componenti esistenti (dove possibile)"
    echo ""
    
    if ! confirm "Vuoi procedere con la migrazione?"; then
        log_info "Migrazione annullata"
        exit 0
    fi
    
    # Execute migration steps
    create_backup
    preserve_existing_code
    setup_nextjs
    create_directory_structure
    create_base_files
    create_smart_dashboard_components
    setup_supabase
    migrate_existing_components
    install_dependencies
    cleanup_and_finalize
    
    # Final report
    echo ""
    echo "=================================================="
    echo "  MIGRAZIONE COMPLETATA! 🎉"
    echo "=================================================="
    echo ""
    echo "✅ Backup salvato in: ${BACKUP_DIR}"
    echo "✅ Progetto convertito a Next.js 14 + TypeScript"
    echo "✅ Struttura Smart Dashboard creata"
    echo "✅ Configurazione Supabase pronta"
    echo ""
    echo "📋 PROSSIMI PASSI:"
    echo ""
    echo "1. Configura Supabase:"
    echo "   - Vai su https://supabase.com e crea un nuovo progetto"
    echo "   - Copia le credenziali in .env.local (usa .env.local.example come template)"
    echo ""
    echo "2. Completa la migrazione dei componenti:"
    echo "   - Il componente GestionaleAdempimenti deve essere convertito manualmente"
    echo "   - Vedi docs/migration-guide.md per istruzioni dettagliate"
    echo ""
    echo "3. Avvia il development server:"
    echo "   npm run dev"
    echo ""
    echo "4. Setup del database:"
    echo "   - Esegui le migration in supabase/migrations/"
    echo "   - Oppure usa: npm run setup-db"
    echo ""
    echo "📚 Documentazione:"
    echo "   - README.md aggiornato con nuove istruzioni"
    echo "   - docs/migration-guide.md per migrazione componenti"
    echo ""
    log_warning "NOTA: Alcuni componenti richiedono conversione manuale da JSX a TSX"
    echo ""
}

# Run main function
main

# Exit successfully
exit 0
EOF