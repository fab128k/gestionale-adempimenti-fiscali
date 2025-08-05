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
