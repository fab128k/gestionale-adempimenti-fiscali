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
