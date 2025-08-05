# 📋 GUIDA COMPLETA MIGRAZIONE: Vite → Next.js + Supabase

## 🎯 Overview

Questa guida ti accompagnerà passo-passo nella migrazione del tuo progetto da **Vite + React + localStorage** a **Next.js 14 + Supabase + Smart Dashboard UI**.

**Tempo stimato**: 2-4 ore (incluso setup Supabase)
**Difficoltà**: Media
**Risultato**: App moderna, scalabile, real-time con UI professionale

---

## 📦 Prerequisiti

Assicurati di avere:
- ✅ Node.js 18+ installato
- ✅ Git installato (opzionale ma consigliato)
- ✅ Un account Supabase (gratuito su [supabase.com](https://supabase.com))
- ✅ Backup del progetto esistente

---

## 🚀 FASE 1: Preparazione e Backup

### 1.1 Naviga nella directory del progetto
```bash
cd /home/admaiora/projects/gestionale-adempimenti-fiscali
```

### 1.2 Esegui lo script di migrazione
```bash
# Rendi eseguibile lo script
chmod +x migrate-to-nextjs-supabase.sh

# Esegui la migrazione
./migrate-to-nextjs-supabase.sh
```

### 1.3 Verifica il backup
Lo script creerà automaticamente un backup completo in:
```
../gestionale-backup-[timestamp]/
```

---

## 🔧 FASE 2: Setup Supabase

### 2.1 Crea un nuovo progetto Supabase

1. Vai su [app.supabase.com](https://app.supabase.com)
2. Clicca su "New Project"
3. Configura:
   - **Name**: Gestionale Fiscale
   - **Database Password**: (genera una password sicura)
   - **Region**: Europe (Frankfurt) per GDPR compliance
   - **Plan**: Free tier

### 2.2 Configura il database

1. Una volta creato il progetto, vai su **SQL Editor**
2. Copia e incolla il contenuto di `supabase/migrations/001_initial_schema.sql`
3. Clicca su "Run" per eseguire la migrazione

### 2.3 Recupera le credenziali

1. Vai su **Settings → API**
2. Copia:
   - **Project URL**: `https://[your-project].supabase.co`
   - **Anon Key**: `eyJ...` (chiave pubblica)
   - **Service Role Key**: `eyJ...` (chiave privata - solo per migrazione)

### 2.4 Configura le variabili d'ambiente

Crea il file `.env.local` nella root del progetto:
```bash
cp .env.local.example .env.local
```

Modifica `.env.local` con le tue credenziali:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📊 FASE 3: Migrazione Dati

### 3.1 Export dei dati esistenti

Apri la **vecchia applicazione** nel browser e nella console (F12):

```javascript
// Esporta i dati esistenti
const data = localStorage.getItem('gestionale-adempimenti-fiscali');
if (data) {
  const parsedData = JSON.parse(data);
  const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gestionale-backup.json';
  a.click();
  console.log('✅ Dati esportati!');
} else {
  console.log('❌ Nessun dato trovato');
}
```

### 3.2 Migrazione automatica (opzione A - Consigliata)

1. Installa le dipendenze:
```bash
npm install
```

2. Esegui lo script di migrazione:
```bash
# Crea la directory per i dati
mkdir migration-data

# Copia il file JSON esportato nella directory
cp ~/Downloads/gestionale-backup.json migration-data/tuaemail@esempio.com.json

# Esegui la migrazione
npx ts-node scripts/migrate-data.ts
```

### 3.3 Migrazione manuale (opzione B)

Se preferisci migrare manualmente dalla console del browser:

1. Apri la nuova app: `http://localhost:3000`
2. Apri la console (F12)
3. Incolla e modifica questo codice:

```javascript
// Sostituisci con i tuoi dati
const SUPABASE_URL = 'https://[your-project].supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...';
const oldData = /* incolla qui il JSON esportato */;
const userEmail = 'tua@email.com';

// Funzione di migrazione (copia da scripts/migrate-data.ts)
// ... codice migrazione ...

// Esegui
migrateData(oldData, userEmail);
```

---

## 🎨 FASE 4: Migrazione Componenti

### 4.1 Analizza il componente esistente

Il file `GestionaleAdempimenti.jsx` deve essere:
1. Convertito in TypeScript
2. Scomposto in componenti modulari
3. Integrato con Supabase

### 4.2 Mappatura componenti

| Vecchio Componente | Nuovo Componente | Path |
|-------------------|------------------|------|
| GestionaleAdempimenti | Multiple components | components/ |
| - Gestione Clienti | ClientManager | components/clients/ |
| - Tabella Scadenze | DeadlineGrid | components/deadlines/ |
| - Vista Kanban | KanbanBoard | components/deadlines/ |
| - Gestione Fogli | SheetManager | components/sheets/ |

### 4.3 Esempio di conversione

**Prima (localStorage):**
```javascript
useEffect(() => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    setState(JSON.parse(savedData));
  }
}, []);
```

**Dopo (Supabase):**
```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', userId)
  .order('denominazione');
```

### 4.4 Crea i nuovi componenti

Per ogni sezione del vecchio componente:

1. **Client Manager** (`components/clients/ClientManager.tsx`):
```typescript
import { useClients } from '@/hooks/useClients'
import { ClientList } from './ClientList'
import { ClientForm } from './ClientForm'

export function ClientManager() {
  const { clients, addClient, updateClient, deleteClient } = useClients()
  // ... implementazione
}
```

2. **Deadline Manager** (`components/deadlines/DeadlineManager.tsx`):
```typescript
import { useRealtimeDeadlines } from '@/hooks/useRealtimeDeadlines'
import { ViewSelector } from './ViewSelector'
import { KanbanBoard } from './KanbanBoard'
import { DataGrid } from './DataGrid'
import { CalendarView } from './CalendarView'

export function DeadlineManager() {
  const { deadlines } = useRealtimeDeadlines()
  const [view, setView] = useState<ViewType>('kanban')
  // ... implementazione
}
```

---

## 🚀 FASE 5: Avvio e Test

### 5.1 Installa le dipendenze
```bash
npm install
```

### 5.2 Avvia il development server
```bash
npm run dev
```

### 5.3 Test funzionalità base

1. **Autenticazione**:
   - Vai su `http://localhost:3000`
   - Registrati con una nuova email
   - Conferma email (controlla inbox)
   - Accedi

2. **Dashboard**:
   - Verifica stats in tempo reale
   - Controlla AI insights
   - Testa quick actions

3. **Gestione Clienti**:
   - Aggiungi nuovo cliente
   - Modifica dati esistenti
   - Verifica real-time updates

4. **Scadenze**:
   - Crea nuova scadenza
   - Testa drag & drop in Kanban
   - Cambia vista (Grid/Calendar)
   - Verifica filtri e ricerca

---

## 🔍 FASE 6: Troubleshooting

### Problemi comuni e soluzioni

#### 1. "Cannot find module '@/components/...'"
```bash
# Verifica tsconfig.json paths
# Assicurati che il path mapping sia corretto
```

#### 2. "Supabase connection error"
```bash
# Verifica .env.local
# Controlla che le chiavi siano corrette
# Verifica che il progetto Supabase sia attivo
```

#### 3. "Build errors TypeScript"
```bash
# Esegui type checking
npm run type-check

# Fix automatici
npx eslint --fix .
```

#### 4. "Dati non migrati correttamente"
- Verifica il formato JSON esportato
- Controlla i log della console
- Usa Supabase Table Editor per debug

---

## 📈 FASE 7: Ottimizzazioni Post-Migrazione

### 7.1 Performance
```bash
# Analizza bundle size
npm run build
npm run analyze

# Ottimizza immagini
npm install next-optimized-images
```

### 7.2 SEO e Meta
Aggiorna `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Gestionale Fiscale - Studio XYZ',
  description: 'Gestione professionale scadenze fiscali',
  keywords: 'commercialista, scadenze fiscali, gestionale',
}
```

### 7.3 Progressive Web App
Aggiungi `public/manifest.json`:
```json
{
  "name": "Gestionale Fiscale",
  "short_name": "GestiFiscal",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff"
}
```

---

## 🚀 FASE 8: Deploy

### Opzione A: Vercel (Consigliato)
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Segui le istruzioni
# Aggiungi variabili ambiente nel dashboard Vercel
```

### Opzione B: Self-hosted
```bash
# Build di produzione
npm run build

# Avvia in produzione
npm run start
```

---

## ✅ Checklist Finale

- [ ] Backup completo creato
- [ ] Supabase configurato e funzionante
- [ ] Dati migrati con successo
- [ ] Autenticazione testata
- [ ] Real-time updates funzionanti
- [ ] Tutte le viste (Kanban/Grid/Calendar) operative
- [ ] Performance ottimizzata
- [ ] Deploy completato

---

## 📚 Risorse Utili

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

## 🤝 Supporto

Per problemi o domande:
1. Controlla i log della console
2. Verifica Supabase Dashboard logs
3. Consulta la documentazione ufficiale
4. Apri una issue su GitHub

---

**Congratulazioni! 🎉** Hai completato con successo la migrazione a una piattaforma moderna, scalabile e professionale!