#!/bin/bash

# ================================================================
# Script di Migrazione: Vite + React → Next.js 14 + Supabase
# ================================================================
# Versione: 1.0.0
# Data: $(date +%Y-%m-%d)
# Descrizione: Migra il progetto gestionale-adempimenti-fiscali
#              alla nuova architettura Smart Dashboard
# ================================================================

set -e  # Esci in caso di errore

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurazione
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
PROJECT_NAME="gestionale-adempimenti-fiscali"
TEMP_DIR="temp_migration"

# ================================================================
# FUNZIONI UTILITY
# ================================================================

print_step() {
    echo -e "\n${BLUE}[STEP]${NC} $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

confirm() {
    read -p "$(echo -e ${YELLOW}"$1 (y/N): "${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 non trovato. Per favore installa $1 prima di continuare."
        exit 1
    fi
}

# ================================================================
# FASE 1: VERIFICA PREREQUISITI
# ================================================================

phase_1_check_prerequisites() {
    print_step "Verifica prerequisiti"
    
    # Verifica comandi necessari
    local commands=("node" "npm" "git")
    for cmd in "${commands[@]}"; do
        check_command $cmd
        print_success "$cmd trovato: $(which $cmd)"
    done
    
    # Verifica versioni
    local node_version=$(node --version)
    local npm_version=$(npm --version)
    
    print_info "Node.js versione: $node_version"
    print_info "npm versione: $npm_version"
    
    # Verifica se siamo nella directory corretta
    if [ ! -f "package.json" ]; then
        print_error "package.json non trovato. Assicurati di essere nella root del progetto."
        exit 1
    fi
    
    # Verifica se il progetto è quello giusto
    if ! grep -q "gestionale-adempimenti-fiscali" package.json; then
        print_error "Questo non sembra essere il progetto gestionale-adempimenti-fiscali"
        exit 1
    fi
    
    print_success "Tutti i prerequisiti sono soddisfatti"
}

# ================================================================
# FASE 2: BACKUP
# ================================================================

phase_2_create_backup() {
    print_step "Creazione backup del progetto attuale"
    
    if confirm "Vuoi creare un backup completo del progetto?"; then
        print_info "Creazione backup in $BACKUP_DIR..."
        
        # Crea directory di backup
        mkdir -p "../$BACKUP_DIR"
        
        # Copia tutti i file eccetto node_modules e .git
        rsync -av --progress \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude 'dist' \
            --exclude '.next' \
            . "../$BACKUP_DIR/"
        
        # Salva anche un dump git se è un repo git
        if [ -d ".git" ]; then
            print_info "Creazione bundle git..."
            git bundle create "../$BACKUP_DIR/git-backup.bundle" --all
        fi
        
        print_success "Backup completato in ../$BACKUP_DIR"
    else
        if ! confirm "Sei sicuro di voler procedere SENZA backup?"; then
            print_warning "Migrazione annullata"
            exit 0
        fi
    fi
}

# ================================================================
# FASE 3: ANALISI PROGETTO ATTUALE
# ================================================================

phase_3_analyze_current_project() {
    print_step "Analisi del progetto attuale"
    
    # Conta file e componenti
    local jsx_files=$(find src -name "*.jsx" -o -name "*.js" | wc -l)
    local css_files=$(find src -name "*.css" | wc -l)
    local total_loc=$(find src -name "*.jsx" -o -name "*.js" | xargs wc -l | tail -1 | awk '{print $1}')
    
    print_info "File JSX/JS trovati: $jsx_files"
    print_info "File CSS trovati: $css_files"
    print_info "Linee di codice totali: $total_loc"
    
    # Verifica dipendenze critiche
    print_info "Dipendenze attuali:"
    cat package.json | grep -A 20 '"dependencies"' | grep -E '^\s*"' | head -10
    
    # Crea report di migrazione
    cat > migration_report.txt << EOF
REPORT MIGRAZIONE - $(date)
================================
Progetto: $PROJECT_NAME
File JSX/JS: $jsx_files
File CSS: $css_files
LOC: $total_loc

Componenti da migrare:
$(find src/components -name "*.jsx" -o -name "*.js" | sed 's/src\//- /')

Note:
- Il componente principale GestionaleAdempimenti.jsx verrà scomposto
- Tutti i file verranno convertiti in TypeScript
- localStorage verrà sostituito con Supabase
EOF
    
    print_success "Analisi completata (vedi migration_report.txt)"
}

# ================================================================
# FASE 4: CREAZIONE STRUTTURA NEXT.JS
# ================================================================

phase_4_create_nextjs_structure() {
    print_step "Creazione nuova struttura Next.js"
    
    print_info "Creazione directory temporanea per il nuovo progetto..."
    mkdir -p "$TEMP_DIR"
    
    # Crea struttura cartelle
    print_info "Creazione struttura cartelle..."
    
    # App directory (Next.js 14 App Router)
    mkdir -p "$TEMP_DIR/app/(auth)/login"
    mkdir -p "$TEMP_DIR/app/(auth)/onboarding"
    mkdir -p "$TEMP_DIR/app/(dashboard)/clienti/[id]"
    mkdir -p "$TEMP_DIR/app/(dashboard)/scadenze/kanban"
    mkdir -p "$TEMP_DIR/app/(dashboard)/scadenze/calendar"
    mkdir -p "$TEMP_DIR/app/(dashboard)/scadenze/grid"
    mkdir -p "$TEMP_DIR/app/(dashboard)/marketplace"
    mkdir -p "$TEMP_DIR/app/(dashboard)/impostazioni"
    mkdir -p "$TEMP_DIR/app/(dashboard)/analytics"
    mkdir -p "$TEMP_DIR/app/api/webhooks/whatsapp"
    
    # Components
    mkdir -p "$TEMP_DIR/components/layout"
    mkdir -p "$TEMP_DIR/components/dashboard"
    mkdir -p "$TEMP_DIR/components/deadlines"
    mkdir -p "$TEMP_DIR/components/clients"
    mkdir -p "$TEMP_DIR/components/ai"
    mkdir -p "$TEMP_DIR/components/marketplace"
    mkdir -p "$TEMP_DIR/components/ui"
    
    # Lib, hooks, types
    mkdir -p "$TEMP_DIR/lib"
    mkdir -p "$TEMP_DIR/hooks"
    mkdir -p "$TEMP_DIR/types"
    
    # Supabase
    mkdir -p "$TEMP_DIR/supabase/migrations"
    mkdir -p "$TEMP_DIR/supabase/functions/ai-assistant"
    
    # Public assets
    mkdir -p "$TEMP_DIR/public/images"
    mkdir -p "$TEMP_DIR/public/fonts"
    
    print_success "Struttura cartelle creata"
}

# ================================================================
# FASE 5: CREAZIONE FILE DI CONFIGURAZIONE
# ================================================================

phase_5_create_config_files() {
    print_step "Creazione file di configurazione"
    
    # Crea package.json
    print_info "Creazione package.json..."
    node scripts/create-package-json.js "$TEMP_DIR"
    
    # Crea tsconfig.json
    print_info "Creazione tsconfig.json..."
    node scripts/create-tsconfig.js "$TEMP_DIR"
    
    # Crea next.config.js
    print_info "Creazione next.config.js..."
    node scripts/create-next-config.js "$TEMP_DIR"
    
    # Crea tailwind.config.ts
    print_info "Creazione tailwind.config.ts..."
    node scripts/create-tailwind-config.js "$TEMP_DIR"
    
    # Crea .env.local.example
    print_info "Creazione .env.local.example..."
    cat > "$TEMP_DIR/.env.local.example" << 'EOF'
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
    
    # Copia altri file di configurazione
    cp .gitignore "$TEMP_DIR/" 2>/dev/null || echo "# Next.js\n.next/\nout/\n\n# Dependencies\nnode_modules/\n\n# Env\n.env.local\n.env*.local\n\n# IDE\n.vscode/\n.idea/\n\n# OS\n.DS_Store\nThumbs.db" > "$TEMP_DIR/.gitignore"
    cp README.md "$TEMP_DIR/" 2>/dev/null || true
    cp LICENSE "$TEMP_DIR/" 2>/dev/null || true
    
    print_success "File di configurazione creati"
}

# ================================================================
# FASE 6: MIGRAZIONE COMPONENTI
# ================================================================

phase_6_migrate_components() {
    print_step "Migrazione componenti React"
    
    print_info "Conversione componenti in TypeScript..."
    
    # Migra il componente principale
    if [ -f "src/components/GestionaleAdempimenti.jsx" ]; then
        print_info "Migrazione GestionaleAdempimenti.jsx..."
        node scripts/migrate-main-component.js "src/components/GestionaleAdempimenti.jsx" "$TEMP_DIR"
    fi
    
    # Migra altri componenti
    for file in src/components/*.jsx; do
        if [ -f "$file" ]; then
            local basename=$(basename "$file")
            print_info "Migrazione $basename..."
            node scripts/migrate-component.js "$file" "$TEMP_DIR/components"
        fi
    done
    
    # Copia e adatta CSS
    if [ -f "src/index.css" ]; then
        cp "src/index.css" "$TEMP_DIR/app/globals.css"
        print_success "CSS globale migrato"
    fi
    
    print_success "Componenti migrati"
}

# ================================================================
# FASE 7: CREAZIONE COMPONENTI SMART DASHBOARD
# ================================================================

phase_7_create_smart_dashboard() {
    print_step "Creazione componenti Smart Dashboard"
    
    print_info "Generazione componenti UI base..."
    node scripts/generate-smart-components.js "$TEMP_DIR"
    
    print_info "Creazione design system..."
    node scripts/create-design-system.js "$TEMP_DIR"
    
    print_info "Setup Supabase client..."
    node scripts/setup-supabase-client.js "$TEMP_DIR"
    
    print_success "Componenti Smart Dashboard creati"
}

# ================================================================
# FASE 8: SETUP DATABASE
# ================================================================

phase_8_setup_database() {
    print_step "Setup schema database Supabase"
    
    print_info "Creazione migration files..."
    node scripts/create-database-schema.js "$TEMP_DIR"
    
    print_success "Schema database creato in supabase/migrations/"
}

# ================================================================
# FASE 9: FINALIZZAZIONE
# ================================================================

phase_9_finalize() {
    print_step "Finalizzazione migrazione"
    
    if confirm "Vuoi sostituire il progetto attuale con quello migrato?"; then
        # Backup node_modules attuale
        if [ -d "node_modules" ]; then
            print_info "Backup node_modules..."
            mv node_modules node_modules_backup
        fi
        
        # Sposta file vecchi in old/
        print_info "Archiviazione file vecchi..."
        mkdir -p old
        mv src old/ 2>/dev/null || true
        mv index.html old/ 2>/dev/null || true
        mv vite.config.js old/ 2>/dev/null || true
        mv dist old/ 2>/dev/null || true
        
        # Copia nuovi file
        print_info "Copia nuovi file..."
        cp -r "$TEMP_DIR"/* .
        cp "$TEMP_DIR"/.env.local.example .
        cp "$TEMP_DIR"/.gitignore .
        
        # Cleanup
        rm -rf "$TEMP_DIR"
        
        print_success "File migrati con successo!"
    else
        print_warning "I file migrati sono disponibili in $TEMP_DIR"
    fi
}

# ================================================================
# FASE 10: POST-MIGRAZIONE
# ================================================================

phase_10_post_migration() {
    print_step "Istruzioni post-migrazione"
    
    cat << 'EOF'

🎉 MIGRAZIONE COMPLETATA! 🎉

Prossimi passi:

1. INSTALLA DIPENDENZE:
   npm install

2. CONFIGURA SUPABASE:
   - Crea un progetto su https://app.supabase.com
   - Copia le credenziali in .env.local
   - Esegui le migration: npx supabase db push

3. SETUP COMPONENTI UI:
   npx shadcn-ui@latest init
   
4. AVVIA IL DEVELOPMENT SERVER:
   npm run dev

5. VERIFICA LA MIGRAZIONE:
   - Controlla che tutte le funzionalità siano migrate
   - Testa l'autenticazione
   - Verifica il real-time

📚 DOCUMENTAZIONE:
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind: https://tailwindcss.com/docs

⚠️  NOTE IMPORTANTI:
- I vecchi file sono in old/
- Il backup (se creato) è in ../$BACKUP_DIR
- Controlla migration_report.txt per dettagli

Per supporto, consulta la documentazione o apri una issue.

EOF
}

# ================================================================
# MAIN EXECUTION
# ================================================================

main() {
    echo -e "${MAGENTA}"
    cat << 'EOF'
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║     MIGRAZIONE GESTIONALE ADEMPIMENTI FISCALI         ║
    ║           Vite + React → Next.js + Supabase           ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    print_warning "Questo script migrerà il tuo progetto alla nuova architettura."
    print_warning "Assicurati di aver committato tutti i cambiamenti prima di procedere."
    
    if ! confirm "Vuoi procedere con la migrazione?"; then
        print_info "Migrazione annullata"
        exit 0
    fi
    
    # Esegui fasi
    phase_1_check_prerequisites
    phase_2_create_backup
    phase_3_analyze_current_project
    
    # Crea script helper se non esistono
    if [ ! -d "scripts" ]; then
        print_info "Creazione script helper..."
        mkdir -p scripts
        # Gli script verranno creati nei prossimi file
    fi
    
    phase_4_create_nextjs_structure
    phase_5_create_config_files
    phase_6_migrate_components
    phase_7_create_smart_dashboard
    phase_8_setup_database
    phase_9_finalize
    phase_10_post_migration
}

# Esegui main
main "$@"
