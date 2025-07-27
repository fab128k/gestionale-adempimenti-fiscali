import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { Plus, Trash2, Edit3, Save, X, FileText, Calendar, Users, Download, Upload, Search, Copy, Check, Building2, MapPin, Phone, Mail, FileCheck } from 'lucide-react';

// ===== COSTANTI E CONFIGURAZIONE =====
const STORAGE_KEY = 'gestionale-adempimenti-fiscali';

const INITIAL_SHEETS = {
  'dichiarazioni_redditi_2024': {
    name: 'Dichiarazioni Redditi 2024',
    columns: [
      'Cliente',
      'Forma Giuridica',
      'Regime Fiscale', 
      'Diritto Camerale',
      'ISA',
      'Stato Dichiarazione',
      'Controlli Telematici',
      'Stato Invio'
    ],
    data: {}
  },
  'bilanci_2024': {
    name: 'Bilanci 2024',
    columns: [
      'Cliente',
      'Tipo Bilancio',
      'Data Chiusura',
      'Stato Redazione',
      'Revisione',
      'Deposito CCIAA',
      'Note'
    ],
    data: {}
  },
  'dichiarazioni_iva_2024': {
    name: 'Dichiarazioni IVA 2024',
    columns: [
      'Cliente',
      'Periodicità',
      'Ultimo Periodo',
      'Stato',
      'Credito/Debito',
      'F24 Inviato',
      'Note'
    ],
    data: {}
  },
  '770_2024': {
    name: 'Modello 770 2024',
    columns: [
      'Cliente',
      'Dipendenti',
      'Collaboratori',
      'Stato Elaborazione',
      'Data Invio',
      'Protocollo',
      'Note'
    ],
    data: {}
  }
};

// Template anagrafica cliente
const EMPTY_CLIENT = {
  denominazione: '',
  tipo: 'persona_fisica', // persona_fisica, societa, altro
  codiceFiscale: '',
  partitaIva: '',
  indirizzo: '',
  cap: '',
  citta: '',
  provincia: '',
  telefono: '',
  email: '',
  pec: '',
  note: ''
};

// ===== UTILITY FUNCTIONS =====
const formatCodiceFiscale = (cf) => {
  if (!cf) return '';
  return cf.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const formatPartitaIva = (piva) => {
  if (!piva) return '';
  return piva.replace(/[^0-9]/g, '');
};

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ===== COMPONENTE MODAL =====
const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} w-full`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE COPIA TESTO =====
const CopyableField = ({ label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!value) return null;

  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <span className="text-sm text-gray-500">{label}:</span>
        <span className="ml-2 text-sm font-medium">{value}</span>
      </div>
      <button
        onClick={handleCopy}
        className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
        title="Copia"
      >
        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-400" />}
      </button>
    </div>
  );
};

// ===== REDUCER =====
const dataReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_DATA':
      return action.payload;
      
    case 'ADD_CLIENT': {
      const clientId = action.payload.id;
      const newClients = { ...state.clients, [clientId]: action.payload };
      const newSheets = { ...state.sheets };
      
      // Inizializza i dati per il nuovo cliente in tutti i fogli
      Object.keys(newSheets).forEach(sheetKey => {
        newSheets[sheetKey] = {
          ...newSheets[sheetKey],
          data: {
            ...newSheets[sheetKey].data,
            [clientId]: {}
          }
        };
      });
      
      return {
        ...state,
        clients: newClients,
        sheets: newSheets
      };
    }

    case 'UPDATE_CLIENT': {
      const updatedState = { ...state };
      updatedState.clients[action.payload.id] = action.payload;
      return updatedState;
    }
      
    case 'REMOVE_CLIENT': {
      const removedState = { ...state };
      delete removedState.clients[action.payload];
      // Rimuovi i dati del cliente da tutti i fogli
      Object.keys(removedState.sheets).forEach(sheetKey => {
        delete removedState.sheets[sheetKey].data[action.payload];
      });
      return removedState;
    }
      
    case 'ADD_SHEET': {
      const { key, name } = action.payload;
      const stateWithNewSheet = { ...state };
      stateWithNewSheet.sheets[key] = {
        name,
        columns: ['Cliente', 'Stato', 'Note'],
        data: {}
      };
      // Inizializza i dati per tutti i clienti
      Object.keys(state.clients).forEach(clientId => {
        stateWithNewSheet.sheets[key].data[clientId] = {};
      });
      return stateWithNewSheet;
    }
      
    case 'REMOVE_SHEET': {
      const stateWithoutSheet = { ...state };
      delete stateWithoutSheet.sheets[action.payload];
      return stateWithoutSheet;
    }
      
    case 'UPDATE_CELL': {
      const { sheetKey, clientId, column, value } = action.payload;
      const cellUpdatedState = { ...state };
      if (!cellUpdatedState.sheets[sheetKey].data[clientId]) {
        cellUpdatedState.sheets[sheetKey].data[clientId] = {};
      }
      cellUpdatedState.sheets[sheetKey].data[clientId][column] = value;
      return cellUpdatedState;
    }
      
    case 'ADD_COLUMN': {
      const { sheetKey: sheet, columnName } = action.payload;
      const columnAddedState = { ...state };
      columnAddedState.sheets[sheet].columns.push(columnName);
      return columnAddedState;
    }
      
    case 'REMOVE_COLUMN': {
      const { sheetKey: sheetToUpdate, columnIndex } = action.payload;
      const columnRemovedState = { ...state };
      const columnToRemove = columnRemovedState.sheets[sheetToUpdate].columns[columnIndex];
      columnRemovedState.sheets[sheetToUpdate].columns.splice(columnIndex, 1);
      Object.keys(columnRemovedState.sheets[sheetToUpdate].data).forEach(clientId => {
        delete columnRemovedState.sheets[sheetToUpdate].data[clientId][columnToRemove];
      });
      return columnRemovedState;
    }
      
    case 'UPDATE_COLUMN_NAME': {
      const { sheetKey: sheetForColumn, oldName, newName } = action.payload;
      const columnUpdatedState = { ...state };
      const colIndex = columnUpdatedState.sheets[sheetForColumn].columns.indexOf(oldName);
      columnUpdatedState.sheets[sheetForColumn].columns[colIndex] = newName;
      Object.keys(columnUpdatedState.sheets[sheetForColumn].data).forEach(clientId => {
        if (columnUpdatedState.sheets[sheetForColumn].data[clientId][oldName] !== undefined) {
          columnUpdatedState.sheets[sheetForColumn].data[clientId][newName] = 
            columnUpdatedState.sheets[sheetForColumn].data[clientId][oldName];
          delete columnUpdatedState.sheets[sheetForColumn].data[clientId][oldName];
        }
      });
      return columnUpdatedState;
    }
      
    default:
      return state;
  }
};

// ===== COMPONENTE FORM ANAGRAFICA =====
const ClientForm = ({ client, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState(client || EMPTY_CLIENT);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.denominazione.trim()) {
      newErrors.denominazione = 'Campo obbligatorio';
    }
    
    if (formData.tipo === 'persona_fisica' && !formData.codiceFiscale) {
      newErrors.codiceFiscale = 'Campo obbligatorio per persone fisiche';
    }
    
    if (formData.tipo === 'societa' && !formData.partitaIva) {
      newErrors.partitaIva = 'Campo obbligatorio per società';
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    if (formData.pec && !validateEmail(formData.pec)) {
      newErrors.pec = 'PEC non valida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const processedData = {
        ...formData,
        codiceFiscale: formatCodiceFiscale(formData.codiceFiscale),
        partitaIva: formatPartitaIva(formData.partitaIva),
        id: formData.id || (Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9))
      };
      console.log('Dati cliente processati:', processedData); // Debug
      onSave(processedData);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tipo Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo Cliente
        </label>
        <select
          value={formData.tipo}
          onChange={(e) => handleChange('tipo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="persona_fisica">Persona Fisica</option>
          <option value="societa">Società</option>
          <option value="altro">Altro</option>
        </select>
      </div>

      {/* Denominazione */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {formData.tipo === 'persona_fisica' ? 'Nome e Cognome' : 'Denominazione'} *
        </label>
        <input
          type="text"
          value={formData.denominazione}
          onChange={(e) => handleChange('denominazione', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.denominazione ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder={formData.tipo === 'persona_fisica' ? 'Mario Rossi' : 'Rossi SRL'}
        />
        {errors.denominazione && <p className="text-red-500 text-xs mt-1">{errors.denominazione}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Codice Fiscale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Codice Fiscale {formData.tipo === 'persona_fisica' && '*'}
          </label>
          <input
            type="text"
            value={formData.codiceFiscale}
            onChange={(e) => handleChange('codiceFiscale', e.target.value)}
            className={`w-full px-3 py-2 border ${errors.codiceFiscale ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="RSSMRA80A01H501A"
            maxLength="16"
          />
          {errors.codiceFiscale && <p className="text-red-500 text-xs mt-1">{errors.codiceFiscale}</p>}
        </div>

        {/* Partita IVA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Partita IVA {formData.tipo === 'societa' && '*'}
          </label>
          <input
            type="text"
            value={formData.partitaIva}
            onChange={(e) => handleChange('partitaIva', e.target.value)}
            className={`w-full px-3 py-2 border ${errors.partitaIva ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="12345678901"
            maxLength="11"
          />
          {errors.partitaIva && <p className="text-red-500 text-xs mt-1">{errors.partitaIva}</p>}
        </div>
      </div>

      {/* Indirizzo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {formData.tipo === 'persona_fisica' ? 'Residenza' : 'Sede Legale'}
        </label>
        <input
          type="text"
          value={formData.indirizzo}
          onChange={(e) => handleChange('indirizzo', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Via Roma, 1"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* CAP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
          <input
            type="text"
            value={formData.cap}
            onChange={(e) => handleChange('cap', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="00100"
            maxLength="5"
          />
        </div>

        {/* Città */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
          <input
            type="text"
            value={formData.citta}
            onChange={(e) => handleChange('citta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Roma"
          />
        </div>

        {/* Provincia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
          <input
            type="text"
            value={formData.provincia}
            onChange={(e) => handleChange('provincia', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="RM"
            maxLength="2"
          />
        </div>
      </div>

      {/* Contatti */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleChange('telefono', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+39 06 1234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="info@esempio.it"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* PEC */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">PEC</label>
        <input
          type="email"
          value={formData.pec}
          onChange={(e) => handleChange('pec', e.target.value)}
          className={`w-full px-3 py-2 border ${errors.pec ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="azienda@pec.it"
        />
        {errors.pec && <p className="text-red-500 text-xs mt-1">{errors.pec}</p>}
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
        <textarea
          value={formData.note}
          onChange={(e) => handleChange('note', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Note aggiuntive..."
        />
      </div>

      {/* Bottoni */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annulla
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isEdit ? 'Aggiorna' : 'Salva'}
        </button>
      </div>
    </div>
  );
};

// ===== COMPONENTE VISUALIZZAZIONE ANAGRAFICA =====
const ClientView = ({ client, onEdit, onClose }) => {
  if (!client) return null;
  
  const getIndirizzoCompleto = () => {
    const parts = [client.indirizzo, client.cap, client.citta, client.provincia].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Header con tipo */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="text-gray-600" size={20} />
          <span className="text-sm text-gray-600">
            {client.tipo === 'persona_fisica' ? 'Persona Fisica' : 
             client.tipo === 'societa' ? 'Società' : 'Altro'}
          </span>
        </div>
        <h2 className="text-xl font-semibold">{client.denominazione}</h2>
      </div>

      {/* Dati fiscali */}
      <div className="bg-blue-50 p-4 rounded-lg space-y-2">
        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <FileCheck size={16} />
          Dati Fiscali
        </h3>
        <CopyableField label="Codice Fiscale" value={client.codiceFiscale} />
        <CopyableField label="Partita IVA" value={client.partitaIva} />
      </div>

      {/* Sede/Residenza */}
      {getIndirizzoCompleto() && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
            <MapPin size={16} />
            {client.tipo === 'persona_fisica' ? 'Residenza' : 'Sede Legale'}
          </h3>
          <CopyableField label="Indirizzo" value={getIndirizzoCompleto()} />
        </div>
      )}

      {/* Contatti */}
      <div className="bg-purple-50 p-4 rounded-lg space-y-2">
        <h3 className="text-sm font-semibold text-purple-800 mb-2">Contatti</h3>
        {client.telefono && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-500" />
            <CopyableField label="Telefono" value={client.telefono} />
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-500" />
            <CopyableField label="Email" value={client.email} />
          </div>
        )}
        {client.pec && (
          <div className="flex items-center gap-2">
            <Mail size={14} className="text-gray-500" />
            <CopyableField label="PEC" value={client.pec} />
          </div>
        )}
      </div>

      {/* Note */}
      {client.note && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Note</h3>
          <p className="text-sm">{client.note}</p>
        </div>
      )}

      {/* Bottoni */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Chiudi
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Edit3 size={16} />
          Modifica
        </button>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPALE =====
const GestionaleAdempimenti = () => {
  const [state, dispatch] = useReducer(dataReducer, {
    clients: {},
    sheets: INITIAL_SHEETS
  });
  
  const [activeSheet, setActiveSheet] = useState('dichiarazioni_redditi_2024');
  const [editingCell, setEditingCell] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stati per modal anagrafica
  const [showClientModal, setShowClientModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, view, edit
  const [selectedClient, setSelectedClient] = useState(null);

  // Carica dati dal localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Assicurati che clients sia sempre un oggetto
        if (!parsedData.clients) {
          parsedData.clients = {};
        }
        if (!parsedData.sheets) {
          parsedData.sheets = INITIAL_SHEETS;
        }
        dispatch({ type: 'INIT_DATA', payload: parsedData });
      } else {
        // Prima volta - inizializza con struttura vuota
        const initialData = {
          clients: {},
          sheets: INITIAL_SHEETS
        };
        dispatch({ type: 'INIT_DATA', payload: initialData });
        // Salva immediatamente la struttura iniziale
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      }
    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      const fallbackData = {
        clients: {},
        sheets: INITIAL_SHEETS
      };
      dispatch({ type: 'INIT_DATA', payload: fallbackData });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackData));
    }
  }, []);

  // Salva i dati nel localStorage quando cambiano
  useEffect(() => {
    if (state && state.clients && state.sheets) {
      console.log('Salvando stato nel localStorage:', state); // Debug
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Filtra clienti in base alla ricerca
  const filteredClients = Object.entries(state.clients || {}).filter(([id, client]) => {
    if (!client) return false;
    const query = searchQuery.toLowerCase();
    return (
      (client.denominazione || '').toLowerCase().includes(query) ||
      (client.codiceFiscale || '').toLowerCase().includes(query) ||
      (client.partitaIva || '').includes(searchQuery)
    );
  });

  // ===== GESTIONE CLIENTI =====
  const handleAddClient = () => {
    setSelectedClient(null);
    setModalMode('add');
    setShowClientModal(true);
  };

  const handleViewClient = (clientId) => {
    setSelectedClient(state.clients[clientId]);
    setModalMode('view');
    setShowClientModal(true);
  };

  const handleEditClient = () => {
    setModalMode('edit');
  };

  const saveClient = (clientData) => {
    console.log('Salvando cliente:', clientData); // Debug
    if (modalMode === 'add') {
      dispatch({ type: 'ADD_CLIENT', payload: clientData });
    } else {
      dispatch({ type: 'UPDATE_CLIENT', payload: clientData });
    }
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const removeClient = (clientId) => {
    const client = state.clients[clientId];
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${client.denominazione}"? Questa azione eliminerà tutti i suoi dati.`)) {
      dispatch({ type: 'REMOVE_CLIENT', payload: clientId });
    }
  };

  // ===== GESTIONE FOGLI =====
  const addSheet = (sheetName) => {
    const sheetKey = sheetName.toLowerCase().replace(/\s+/g, '_');
    if (state.sheets[sheetKey]) {
      alert('Esiste già un foglio con questo nome!');
      return;
    }
    dispatch({ type: 'ADD_SHEET', payload: { key: sheetKey, name: sheetName } });
    setActiveSheet(sheetKey);
    setShowAddSheet(false);
  };

  const removeSheet = (sheetKey) => {
    if (Object.keys(state.sheets).length <= 1) {
      alert('Deve rimanere almeno un foglio!');
      return;
    }
    if (window.confirm(`Sei sicuro di voler eliminare il foglio "${state.sheets[sheetKey].name}"?`)) {
      dispatch({ type: 'REMOVE_SHEET', payload: sheetKey });
      if (activeSheet === sheetKey) {
        setActiveSheet(Object.keys(state.sheets)[0]);
      }
    }
  };

  // ===== GESTIONE CELLE =====
  const updateCell = useCallback((sheetKey, clientId, column, value) => {
    dispatch({ 
      type: 'UPDATE_CELL', 
      payload: { sheetKey, clientId, column, value } 
    });
    setEditingCell(null);
  }, []);

  // ===== GESTIONE COLONNE =====
  const addColumn = (columnName) => {
    const currentColumns = state.sheets[activeSheet].columns;
    if (currentColumns.includes(columnName)) {
      alert('Colonna già esistente!');
      return;
    }
    dispatch({ 
      type: 'ADD_COLUMN', 
      payload: { sheetKey: activeSheet, columnName } 
    });
    setShowAddColumn(false);
  };

  const removeColumn = (columnIndex) => {
    if (columnIndex === 0) {
      alert('La colonna Cliente non può essere eliminata!');
      return;
    }
    const columnName = state.sheets[activeSheet].columns[columnIndex];
    if (window.confirm(`Sei sicuro di voler eliminare la colonna "${columnName}"?`)) {
      dispatch({ 
        type: 'REMOVE_COLUMN', 
        payload: { sheetKey: activeSheet, columnIndex } 
      });
    }
  };

  const updateColumnName = (oldName, newName) => {
    if (oldName === 'Cliente') {
      alert('Il nome della colonna Cliente non può essere modificato!');
      return;
    }
    if (state.sheets[activeSheet].columns.includes(newName) && newName !== oldName) {
      alert('Esiste già una colonna con questo nome!');
      return;
    }
    dispatch({ 
      type: 'UPDATE_COLUMN_NAME', 
      payload: { sheetKey: activeSheet, oldName, newName } 
    });
    setEditingColumn(null);
  };

  // ===== EXPORT/IMPORT =====
  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `gestionale_fiscale_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Gestione retrocompatibilità: converti vecchio formato clienti (array) in nuovo formato (oggetto)
          if (importedData.clients && Array.isArray(importedData.clients)) {
            const clientsObj = {};
            importedData.clients.forEach(clientName => {
              const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
              clientsObj[id] = {
                id: id,
                denominazione: clientName,
                tipo: 'persona_fisica',
                codiceFiscale: '',
                partitaIva: '',
                indirizzo: '',
                cap: '',
                citta: '',
                provincia: '',
                telefono: '',
                email: '',
                pec: '',
                note: ''
              };
            });
            importedData.clients = clientsObj;
          }
          
          if (importedData.clients && importedData.sheets) {
            dispatch({ type: 'INIT_DATA', payload: importedData });
            alert('Dati importati con successo!');
          } else {
            alert('Formato file non valido!');
          }
        } catch (error) {
          alert('Errore nell\'importazione del file!');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const currentSheet = state.sheets[activeSheet];
  if (!currentSheet) return null;

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="text-blue-600" />
                Gestionale Adempimenti Fiscali
              </h1>
              <p className="text-gray-600 mt-2">Studio di Commercialisti - Gestione Scadenze e Adempimenti</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} />
                {Object.keys(state.clients || {}).length} clienti
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                {Object.keys(state.sheets).length} adempimenti
              </div>
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
                title="Esporta dati"
              >
                <Download size={16} />
                Esporta
              </button>
              <label className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm cursor-pointer">
                <Upload size={16} />
                Importa
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Barra Azioni */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={handleAddClient}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                Aggiungi Cliente
              </button>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca cliente per nome, CF o P.IVA..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab dei Fogli */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="flex space-x-1 overflow-x-auto">
                {Object.entries(state.sheets).map(([key, sheet]) => (
                  <div key={key} className="flex items-center">
                    <button
                      onClick={() => setActiveSheet(key)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-md whitespace-nowrap ${
                        activeSheet === key
                          ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {sheet.name}
                    </button>
                    {Object.keys(state.sheets).length > 1 && (
                      <button
                        onClick={() => removeSheet(key)}
                        className="ml-2 text-red-500 hover:text-red-700 p-1"
                        title="Elimina foglio"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowAddSheet(true)}
                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center gap-1 text-sm"
              >
                <Plus size={14} />
                Nuovo Foglio
              </button>
            </div>
            
            {showAddSheet && (
              <div className="px-4 pb-4">
                <EditableInput
                  placeholder="Nome del nuovo adempimento"
                  onSave={addSheet}
                  onCancel={() => setShowAddSheet(false)}
                />
              </div>
            )}
          </div>

          {/* Controlli Colonne */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Gestione Colonne:</span>
              {showAddColumn ? (
                <EditableInput
                  placeholder="Nome nuova colonna"
                  onSave={addColumn}
                  onCancel={() => setShowAddColumn(false)}
                  className="text-sm"
                />
              ) : (
                <button
                  onClick={() => setShowAddColumn(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={14} />
                  Aggiungi Colonna
                </button>
              )}
            </div>
          </div>

          {/* Tabella */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {currentSheet.columns.map((column, colIndex) => (
                    <th key={colIndex} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative group">
                      {editingColumn === `${activeSheet}-${colIndex}` ? (
                        <EditableInput
                          value={column}
                          onSave={(newName) => updateColumnName(column, newName)}
                          onCancel={() => setEditingColumn(null)}
                          className="text-sm"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>{column}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {colIndex > 0 && (
                              <>
                                <button
                                  onClick={() => setEditingColumn(`${activeSheet}-${colIndex}`)}
                                  className="text-blue-500 hover:text-blue-700 p-1"
                                  title="Modifica nome colonna"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => removeColumn(colIndex)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Elimina colonna"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.length > 0 ? (
                  filteredClients.map(([clientId, client], clientIndex) => (
                    <tr key={clientId} className="hover:bg-gray-50">
                      {currentSheet.columns.map((column, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 whitespace-nowrap text-sm">
                          {colIndex === 0 ? (
                            <button
                              onClick={() => handleViewClient(clientId)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {client.denominazione}
                            </button>
                          ) : editingCell === `${activeSheet}-${clientId}-${colIndex}` ? (
                            <input
                              type="text"
                              defaultValue={currentSheet.data[clientId]?.[column] || ''}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  updateCell(activeSheet, clientId, column, e.target.value);
                                }
                              }}
                              onBlur={(e) => {
                                updateCell(activeSheet, clientId, column, e.target.value);
                              }}
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => setEditingCell(`${activeSheet}-${clientId}-${colIndex}`)}
                              className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] min-w-[50px]"
                            >
                              {currentSheet.data[clientId]?.[column] || ''}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={currentSheet.columns.length} className="px-4 py-8 text-center text-gray-500">
                      Nessun cliente trovato. Clicca su "Aggiungi Cliente" per iniziare.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Gestionale Adempimenti Fiscali - Fai clic su una cella per modificarla</p>
          <p className="mt-1 text-xs">I dati vengono salvati automaticamente nel browser</p>
        </div>
      </div>

      {/* Modal Anagrafica Cliente */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title={
          modalMode === 'add' ? 'Nuovo Cliente' :
          modalMode === 'edit' ? 'Modifica Cliente' :
          'Anagrafica Cliente'
        }
        size="large"
      >
        {(modalMode === 'add' || modalMode === 'edit') ? (
          <ClientForm
            client={selectedClient}
            onSave={saveClient}
            onCancel={() => setShowClientModal(false)}
            isEdit={modalMode === 'edit'}
          />
        ) : (
          <ClientView
            client={selectedClient}
            onEdit={handleEditClient}
            onClose={() => setShowClientModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

// ===== COMPONENTI HELPER PER INPUT EDITABILE =====
const EditableInput = ({ value, onSave, onCancel, placeholder, className = "" }) => {
  const [inputValue, setInputValue] = useState(value || '');
  
  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
    }
  };
  
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={!inputValue.trim()}
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={16} />
      </button>
      <button
        onClick={onCancel}
        className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default GestionaleAdempimenti;