// test-connection.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Le tue credenziali
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verifica configurazione:')
console.log('━'.repeat(50))
console.log('URL:', supabaseUrl ? '✅ ' + supabaseUrl : '❌ Non trovato')
console.log('Key:', supabaseKey ? '✅ Configurata (eyJ...)' : '❌ Non trovata')
console.log('━'.repeat(50))

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Credenziali mancanti!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('\n🚀 Test connessione a Supabase...\n')
  
  try {
    // Test 1: Verifica che il progetto esista
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('⚠️  La tabella "users" non esiste ancora')
        console.log('   Questo è normale se non hai ancora applicato le migrazioni\n')
        console.log('📝 Per creare le tabelle:')
        console.log('   1. Vai su: https://supabase.com/dashboard/project/rdebrjkhutyqeiitwttr/sql/new')
        console.log('   2. Incolla il contenuto di: supabase/migrations/001_initial_schema.sql')
        console.log('   3. Clicca "Run"\n')
      } else {
        console.log('⚠️  Errore:', testError.message)
      }
    } else {
      console.log('✅ Connessione al database OK!')
      console.log('✅ Tabella "users" trovata')
    }
    
    // Test 2: Auth
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (!authError) {
      console.log('✅ Autenticazione configurata correttamente')
    }
    
    // Test 3: Prova a leggere tutte le tabelle
    console.log('\n📊 Verifica tabelle:')
    const tables = ['users', 'clients', 'deadlines', 'notifications', 'templates']
    let tablesFound = 0
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (!error) {
        console.log(`  ✅ ${table}`)
        tablesFound++
      } else if (error.code === 'PGRST116') {
        console.log(`  ❌ ${table} (non esiste)`)
      } else {
        console.log(`  ⚠️  ${table} (${error.message})`)
      }
    }
    
    console.log('\n' + '━'.repeat(50))
    
    if (tablesFound === 0) {
      console.log('🔧 SETUP RICHIESTO:')
      console.log('   Le tabelle non sono ancora state create.')
      console.log('   Segui le istruzioni sopra per applicare le migrazioni.')
    } else if (tablesFound < tables.length) {
      console.log('⚠️  SETUP PARZIALE:')
      console.log(`   Solo ${tablesFound}/${tables.length} tabelle trovate.`)
      console.log('   Verifica le migrazioni del database.')
    } else {
      console.log('🎉 TUTTO PRONTO!')
      console.log('   Database completamente configurato.')
      console.log('   Puoi iniziare con: npm run dev')
    }
    
    console.log('━'.repeat(50))
    console.log('\n📋 Info Progetto:')
    console.log('   Supabase: https://supabase.com/dashboard/project/rdebrjkhutyqeiitwttr')
    console.log('   Vercel: https://gestionale-adempimenti-fiscali-sfhz.vercel.app')
    console.log('   Local: http://localhost:3000')
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message)
  }
}

testConnection()
