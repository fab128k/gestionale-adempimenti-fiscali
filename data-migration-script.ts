// ===== scripts/migrate-data.ts =====
/**
 * Script di migrazione dati da localStorage/vecchio formato a Supabase
 * 
 * Utilizzo:
 * 1. Esegui lo script nella console del browser con i dati esistenti
 * 2. O salvalo come migrate-data.ts e eseguilo con ts-node
 */

import { createClient } from '@supabase/supabase-js'

// Configurazione - Sostituisci con i tuoi valori
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-project-url'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key'

// Tipi per il vecchio formato
interface OldClient {
  denominazione: string
  tipo?: string
  codiceFiscale?: string
  partitaIva?: string
  email?: string
  pec?: string
  telefono?: string
  indirizzo?: string
  cap?: string
  citta?: string
  provincia?: string
  note?: string
}

interface OldSheet {
  name: string
  columns: string[]
  data: Record<string, Record<string, any>>
}

interface OldData {
  clients: Record<string, OldClient | string>
  sheets: Record<string, OldSheet>
}

// Funzione principale di migrazione
export async function migrateData(oldData: OldData, userEmail: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🚀 Inizio migrazione dati...')
  
  try {
    // 1. Trova o crea l'utente
    let userId: string
    
    // Prova a trovare l'utente esistente
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()
    
    if (existingUser) {
      userId = existingUser.id
      console.log('✅ Utente esistente trovato:', userId)
    } else {
      // Crea nuovo utente (nota: in produzione l'utente dovrebbe registrarsi via auth)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true
      })
      
      if (authError) throw authError
      userId = authUser.user.id
      
      // Inserisci nella tabella users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          studio_name: 'Studio Migrato',
          plan: 'free'
        })
      
      if (userError) throw userError
      console.log('✅ Nuovo utente creato:', userId)
    }

    // 2. Migra i clienti
    console.log('📋 Migrazione clienti...')
    const clientIdMap = new Map<string, string>() // Mappa vecchio ID -> nuovo ID
    
    for (const [oldId, clientData] of Object.entries(oldData.clients)) {
      try {
        let client: OldClient
        
        // Gestisci sia stringhe che oggetti
        if (typeof clientData === 'string') {
          client = {
            denominazione: clientData,
            tipo: 'persona_fisica'
          }
        } else {
          client = clientData
        }
        
        // Prepara dati per Supabase
        const newClient = {
          user_id: userId,
          denominazione: client.denominazione,
          tipo: client.tipo || 'persona_fisica',
          codice_fiscale: client.codiceFiscale || null,
          partita_iva: client.partitaIva || null,
          indirizzo: client.indirizzo || null,
          cap: client.cap || null,
          citta: client.citta || null,
          provincia: client.provincia || null,
          email: client.email || null,
          pec: client.pec || null,
          telefono: client.telefono || null,
          whatsapp_enabled: false,
          metadata: { oldId } // Salva il vecchio ID per riferimento
        }
        
        const { data, error } = await supabase
          .from('clients')
          .insert(newClient)
          .select()
          .single()
        
        if (error) {
          console.error(`❌ Errore migrazione cliente ${client.denominazione}:`, error)
          continue
        }
        
        clientIdMap.set(oldId, data.id)
        console.log(`✅ Cliente migrato: ${client.denominazione}`)
      } catch (err) {
        console.error(`❌ Errore elaborazione cliente ${oldId}:`, err)
      }
    }
    
    console.log(`✅ Migrati ${clientIdMap.size} clienti`)

    // 3. Migra le scadenze dai fogli
    console.log('📅 Migrazione scadenze...')
    let totalDeadlines = 0
    
    // Mappa dei tipi di scadenza basata sui nomi dei fogli
    const deadlineTypeMap: Record<string, string> = {
      'dichiarazioni_redditi_2024': 'Dichiarazione Redditi',
      'bilanci_2024': 'Bilancio',
      'dichiarazioni_iva_2024': 'Dichiarazione IVA',
      '770_2024': 'Modello 770'
    }
    
    for (const [sheetKey, sheet] of Object.entries(oldData.sheets)) {
      const deadlineType = deadlineTypeMap[sheetKey] || sheet.name
      
      for (const [clientKey, sheetData] of Object.entries(sheet.data)) {
        const newClientId = clientIdMap.get(clientKey)
        if (!newClientId) {
          console.warn(`⚠️ Cliente non trovato per ID: ${clientKey}`)
          continue
        }
        
        // Estrai dati rilevanti dalle colonne
        const stato = sheetData['Stato'] || sheetData['Stato Dichiarazione'] || 'pending'
        const dataScadenza = sheetData['Data Scadenza'] || sheetData['Data Chiusura']
        const importo = sheetData['Importo'] || sheetData['Credito/Debito']
        const note = sheetData['Note']
        
        // Determina lo stato in base ai valori esistenti
        let status: 'pending' | 'completed' | 'in_progress' = 'pending'
        if (stato?.toLowerCase().includes('complet') || stato?.toLowerCase().includes('inviat')) {
          status = 'completed'
        } else if (stato?.toLowerCase().includes('elabora') || stato?.toLowerCase().includes('progress')) {
          status = 'in_progress'
        }
        
        // Crea scadenza solo se abbiamo dati significativi
        if (Object.keys(sheetData).length > 0) {
          const deadline = {
            user_id: userId,
            client_id: newClientId,
            type: deadlineType,
            description: note || `${deadlineType} - ${sheet.name}`,
            amount: importo ? parseFloat(importo.toString().replace(/[^\d.-]/g, '')) : null,
            due_date: dataScadenza || getDefaultDueDate(sheetKey),
            status,
            priority: 'normal' as const
          }
          
          const { error } = await supabase
            .from('deadlines')
            .insert(deadline)
          
          if (error) {
            console.error(`❌ Errore creazione scadenza:`, error)
          } else {
            totalDeadlines++
          }
        }
      }
    }
    
    console.log(`✅ Migrate ${totalDeadlines} scadenze`)

    // 4. Report finale
    console.log('\n📊 MIGRAZIONE COMPLETATA!')
    console.log(`- Utente: ${userEmail}`)
    console.log(`- Clienti migrati: ${clientIdMap.size}`)
    console.log(`- Scadenze create: ${totalDeadlines}`)
    console.log(`- Fogli elaborati: ${Object.keys(oldData.sheets).length}`)
    
    return {
      success: true,
      userId,
      clientsCount: clientIdMap.size,
      deadlinesCount: totalDeadlines
    }
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error)
    return {
      success: false,
      error
    }
  }
}

// Funzione helper per determinare date di default
function getDefaultDueDate(sheetKey: string): string {
  const now = new Date()
  const year = now.getFullYear()
  
  const defaultDates: Record<string, string> = {
    'dichiarazioni_redditi_2024': `${year}-11-30`,
    'bilanci_2024': `${year}-12-31`,
    'dichiarazioni_iva_2024': `${year}-03-31`,
    '770_2024': `${year}-10-31`
  }
  
  return defaultDates[sheetKey] || `${year}-12-31`
}

// ===== Utilizzo da Browser Console =====
// Copia e incolla questo codice nella console del browser sulla vecchia app

/*
// 1. Recupera i dati dal localStorage
const savedData = localStorage.getItem('gestionale-adempimenti-fiscali');
const oldData = JSON.parse(savedData);

// 2. Esegui la migrazione (sostituisci con la tua email)
migrateData(oldData, 'tuo@email.com').then(result => {
  if (result.success) {
    console.log('✅ Migrazione completata con successo!');
    console.log('Puoi ora accedere alla nuova applicazione');
  } else {
    console.error('❌ Migrazione fallita:', result.error);
  }
});
*/

// ===== Script Node.js per migrazione batch =====
// Salva come migrate-batch.ts e esegui con ts-node

async function migrateBatch() {
  // Leggi file JSON esportati
  const fs = require('fs')
  const path = require('path')
  
  const dataDir = path.join(__dirname, '../migration-data')
  const files = fs.readdirSync(dataDir).filter((f: string) => f.endsWith('.json'))
  
  console.log(`📁 Trovati ${files.length} file da migrare`)
  
  for (const file of files) {
    console.log(`\n📄 Elaborazione ${file}...`)
    
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'))
    const email = file.replace('.json', '')
    
    await migrateData(data, email)
  }
  
  console.log('\n✅ Migrazione batch completata!')
}

// Esegui se chiamato direttamente
if (require.main === module) {
  migrateBatch().catch(console.error)
}

// ===== Utility per export dati dalla vecchia app =====
export function exportOldData() {
  const data = localStorage.getItem('gestionale-adempimenti-fiscali')
  if (!data) {
    console.error('Nessun dato trovato nel localStorage')
    return
  }
  
  const parsedData = JSON.parse(data)
  const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gestionale-export-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  
  console.log('✅ Dati esportati con successo!')
}