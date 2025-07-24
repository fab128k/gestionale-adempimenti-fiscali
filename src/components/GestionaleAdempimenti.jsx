import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { Plus, Trash2, Edit3, Save, X, FileText, Calendar, Users, Download, Upload, UserPlus } from 'lucide-react';

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

const DEFAULT_CLIENTS = ['Mario Rossi SRL', 'Giuseppe Verdi SNC', 'Paola Bianchi'];

// ===== UTILITY FUNCTIONS =====
const showAlert = (message) => alert(message);
const showConfirm = (message) => window.confirm(message);

const resetFileInput = (event) => {
  event.target.value = '';
};

const createFileName = (prefix) => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.json`;
};

const downloadJSON = (data, fileName) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', fileName);
  linkElement.click();
};

const sanitizeKey = (name) => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

const isValidClient = (client) => {
  return client && typeof client === 'string' && client.trim();
};

// ===== REDUCER =====
const dataReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_DATA':
      return action.payload;
      
    case 'ADD_CLIENT': {
      const newState = { ...state };
      newState.clients.push(action.payload);
      Object.keys(newState.sheets).forEach(sheetKey => {
        newState.sheets[sheetKey].data[action.payload] = {};
      });
      return newState;
    }

    case 'ADD_MULTIPLE_CLIENTS': {
      const multiClientState = { ...state };
      action.payload.forEach(client => {
        if (!multiClientState.clients.includes(client)) {
          multiClientState.clients.push(client);
          Object.keys(multiClientState.sheets).forEach(sheetKey => {
            multiClientState.sheets[sheetKey].data[client] = {};
          });
        }
      });
      return multiClientState;
    }
      
    case 'REMOVE_CLIENT': {
      const updatedState = { ...state };
      updatedState.clients = updatedState.clients.filter(c => c !== action.payload);
      Object.keys(updatedState.sheets).forEach(sheetKey => {
        delete updatedState.sheets[sheetKey].data[action.payload];
      });
      return updatedState;
    }
      
    case 'ADD_SHEET': {
      const { key, name } = action.payload;
      const stateWithNewSheet = { ...state };
      stateWithNewSheet.sheets[key] = {
        name,
        columns: ['Cliente', 'Stato', 'Note'],
        data: {}
      };
      state.clients.forEach(client => {
        stateWithNewSheet.sheets[key].data[client] = {};
      });
      return stateWithNewSheet;
    }
      
    case 'REMOVE_SHEET': {
      const stateWithoutSheet = { ...state };
      delete stateWithoutSheet.sheets[action.payload];
      return stateWithoutSheet;
    }
      
    case 'UPDATE_CELL': {
      const { sheetKey, client, column, value } = action.payload;
      const cellUpdatedState = { ...state };
      if (!cellUpdatedState.sheets[sheetKey].data[client]) {
        cellUpdatedState.sheets[sheetKey].data[client] = {};
      }
      cellUpdatedState.sheets[sheetKey].data[client][column] = value;
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
      Object.keys(columnRemovedState.sheets[sheetToUpdate].data).forEach(client => {
        delete columnRemovedState.sheets[sheetToUpdate].data[client][columnToRemove];
      });
      return columnRemovedState;
    }
      
    case 'UPDATE_COLUMN_NAME': {
      const { sheetKey: sheetForColumn, oldName, newName } = action.payload;
      const columnUpdatedState = { ...state };
      const colIndex = columnUpdatedState.sheets[sheetForColumn].columns.indexOf(oldName);
      columnUpdatedState.sheets[sheetForColumn].columns[colIndex] = newName;
      Object.keys(columnUpdatedState.sheets[sheetForColumn].data).forEach(client => {
        if (columnUpdatedState.sheets[sheetForColumn].data[client][oldName] !== undefined) {
          columnUpdatedState.sheets[sheetForColumn].data[client][newName] = 
            columnUpdatedState.sheets[sheetForColumn].data[client][oldName];
          delete columnUpdatedState.sheets[sheetForColumn].data[client][oldName];
        }
      });
      return columnUpdatedState;
    }
      
    default:
      return state;
  }
};

// ===== COMPONENTI RIUTILIZZABILI =====
const SaveCancelButtons = ({ onSave, onCancel, saveDisabled = false }) => (
  <>
    <button
      onClick={onSave}
      disabled={saveDisabled}
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
  </>
);

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
      <SaveCancelButtons 
        onSave={handleSave} 
        onCancel={onCancel}
        saveDisabled={!inputValue.trim()}
      />
    </div>
  );
};

const ActionButton = ({ onClick, color, icon: Icon, text, title }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    red: 'bg-red-600 hover:bg-red-700',
    gray: 'bg-gray-400 hover:bg-gray-500'
  };
  
  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm`}
      title={title}
    >
      <Icon size={16} />
      {text}
    </button>
  );
};

const FileInputButton = ({ onChange, color, icon: Icon, text, title }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };
  
  return (
    <label className={`${colorClasses[color]} text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm cursor-pointer`}>
      <Icon size={16} />
      {text}
      <input
        type="file"
        accept=".json"
        onChange={onChange}
        className="hidden"
        title={title}
      />
    </label>
  );
};

// ===== COMPONENTE PRINCIPALE =====
const GestionaleAdempimenti = () => {
  const [state, dispatch] = useReducer(dataReducer, {
    clients: [],
    sheets: INITIAL_SHEETS
  });
  
  const [activeSheet, setActiveSheet] = useState('dichiarazioni_redditi_2024');
  const [editingCell, setEditingCell] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Carica dati dal localStorage o inizializza con dati di esempio
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'INIT_DATA', payload: parsedData });
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        dispatch({ 
          type: 'INIT_DATA', 
          payload: {
            clients: DEFAULT_CLIENTS,
            sheets: INITIAL_SHEETS
          }
        });
      }
    } else {
      dispatch({ 
        type: 'INIT_DATA', 
        payload: {
          clients: DEFAULT_CLIENTS,
          sheets: INITIAL_SHEETS
        }
      });
    }
  }, []);

  // Salva i dati nel localStorage quando cambiano
  useEffect(() => {
    if (state.clients.length > 0 || Object.keys(state.sheets).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // ===== GESTIONE CLIENTI =====
  const addClient = (clientName) => {
    if (state.clients.includes(clientName)) {
      showAlert('Cliente già esistente!');
      return;
    }
    dispatch({ type: 'ADD_CLIENT', payload: clientName });
    setShowAddClient(false);
  };

  const removeClient = (client) => {
    if (showConfirm(`Sei sicuro di voler eliminare il cliente "${client}"? Questa azione eliminerà tutti i suoi dati.`)) {
      dispatch({ type: 'REMOVE_CLIENT', payload: client });
    }
  };

  // ===== GESTIONE FOGLI =====
  const addSheet = (sheetName) => {
    const sheetKey = sanitizeKey(sheetName);
    if (state.sheets[sheetKey]) {
      showAlert('Esiste già un foglio con questo nome!');
      return;
    }
    dispatch({ type: 'ADD_SHEET', payload: { key: sheetKey, name: sheetName } });
    setActiveSheet(sheetKey);
    setShowAddSheet(false);
  };

  const removeSheet = (sheetKey) => {
    if (Object.keys(state.sheets).length <= 1) {
      showAlert('Deve rimanere almeno un foglio!');
      return;
    }
    if (showConfirm(`Sei sicuro di voler eliminare il foglio "${state.sheets[sheetKey].name}"?`)) {
      dispatch({ type: 'REMOVE_SHEET', payload: sheetKey });
      if (activeSheet === sheetKey) {
        setActiveSheet(Object.keys(state.sheets)[0]);
      }
    }
  };

  // ===== GESTIONE CELLE =====
  const updateCell = useCallback((sheetKey, client, column, value) => {
    dispatch({ 
      type: 'UPDATE_CELL', 
      payload: { sheetKey, client, column, value } 
    });
    setEditingCell(null);
  }, []);

  // ===== GESTIONE COLONNE =====
  const addColumn = (columnName) => {
    const currentColumns = state.sheets[activeSheet].columns;
    if (currentColumns.includes(columnName)) {
      showAlert('Colonna già esistente!');
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
      showAlert('La colonna Cliente non può essere eliminata!');
      return;
    }
    const columnName = state.sheets[activeSheet].columns[columnIndex];
    if (showConfirm(`Sei sicuro di voler eliminare la colonna "${columnName}"?`)) {
      dispatch({ 
        type: 'REMOVE_COLUMN', 
        payload: { sheetKey: activeSheet, columnIndex } 
      });
    }
  };

  const updateColumnName = (oldName, newName) => {
    if (oldName === 'Cliente') {
      showAlert('Il nome della colonna Cliente non può essere modificato!');
      return;
    }
    if (state.sheets[activeSheet].columns.includes(newName) && newName !== oldName) {
      showAlert('Esiste già una colonna con questo nome!');
      return;
    }
    dispatch({ 
      type: 'UPDATE_COLUMN_NAME', 
      payload: { sheetKey: activeSheet, oldName, newName } 
    });
    setEditingColumn(null);
  };

  // ===== EXPORT FUNCTIONS =====
  const exportData = () => {
    downloadJSON(state, createFileName('gestionale_fiscale'));
  };

  const exportClients = () => {
    downloadJSON({ clients: state.clients }, createFileName('clienti'));
  };

  // ===== IMPORT FUNCTIONS =====
  const parseImportedClients = (data) => {
    // Supporta sia {"clients": [...]} che array diretto [...]
    if (data.clients && Array.isArray(data.clients)) {
      return data.clients;
    } else if (Array.isArray(data)) {
      return data;
    }
    return null;
  };

  const importCompleteData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (importedData.clients && importedData.sheets) {
          if (showConfirm('Questa operazione sostituirà tutti i dati esistenti. Continuare?')) {
            dispatch({ type: 'INIT_DATA', payload: importedData });
            showAlert('Dati completi importati con successo!');
          }
        } else {
          showAlert('File non valido! Per l\'importazione completa il file deve contenere: {"clients": [...], "sheets": {...}}');
        }
      } catch (error) {
        showAlert('Errore nell\'importazione del file! Verifica che sia un JSON valido.');
      }
    };
    reader.readAsText(file);
    resetFileInput(event);
  };

  const importClientsOnly = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const clientsToAdd = parseImportedClients(importedData);
        
        if (!clientsToAdd) {
          showAlert('Formato file non valido per l\'importazione clienti!\nFormati supportati:\n- {"clients": ["Cliente1", "Cliente2", ...]}\n- ["Cliente1", "Cliente2", ...]');
          return;
        }
        
        // Filtra clienti validi e non duplicati
        const newClients = clientsToAdd
          .filter(client => isValidClient(client) && !state.clients.includes(client.trim()))
          .map(client => client.trim());
        
        if (newClients.length > 0) {
          dispatch({ type: 'ADD_MULTIPLE_CLIENTS', payload: newClients });
          showAlert(`${newClients.length} nuovi clienti importati con successo!`);
        } else {
          showAlert('Nessun nuovo cliente da importare (tutti già presenti o non validi).');
        }
      } catch (error) {
        showAlert('Errore nell\'importazione del file! Verifica che sia un JSON valido.');
      }
    };
    reader.readAsText(file);
    resetFileInput(event);
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
                {state.clients.length} clienti
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                {Object.keys(state.sheets).length} adempimenti
              </div>
              <ActionButton
                onClick={exportData}
                color="green"
                icon={Download}
                text="Esporta Tutto"
                title="Esporta tutti i dati (clienti + fogli)"
              />
              <ActionButton
                onClick={exportClients}
                color="purple"
                icon={UserPlus}
                text="Esporta Clienti"
                title="Esporta solo la lista clienti"
              />
              <FileInputButton
                onChange={importCompleteData}
                color="blue"
                icon={Upload}
                text="Importa"
                title="Importa file completo (sostituisce tutti i dati)"
              />
              <FileInputButton
                onChange={importClientsOnly}
                color="orange"
                icon={UserPlus}
                text="Importa Clienti"
                title="Importa solo clienti (aggiunge ai dati esistenti)"
              />
            </div>
          </div>
        </div>

        {/* Gestione Clienti */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Gestione Clienti</h2>
            <button
              onClick={() => setShowAddClient(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Aggiungi Cliente
            </button>
          </div>
          
          {showAddClient && (
            <EditableInput
              placeholder="Nome/Denominazione cliente"
              onSave={addClient}
              onCancel={() => setShowAddClient(false)}
              className="mb-4"
            />
          )}
          
          <div className="flex flex-wrap gap-2">
            {state.clients.map((client, index) => (
              <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="text-sm">{client}</span>
                <button
                  onClick={() => removeClient(client)}
                  className="text-red-500 hover:text-red-700"
                  title="Elimina cliente"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
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
                {state.clients.map((client, clientIndex) => (
                  <tr key={clientIndex} className="hover:bg-gray-50">
                    {currentSheet.columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 whitespace-nowrap text-sm">
                        {colIndex === 0 ? (
                          <span className="font-medium text-gray-900">{client}</span>
                        ) : editingCell === `${activeSheet}-${clientIndex}-${colIndex}` ? (
                          <input
                            type="text"
                            defaultValue={currentSheet.data[client]?.[column] || ''}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateCell(activeSheet, client, column, e.target.value);
                              }
                            }}
                            onBlur={(e) => {
                              updateCell(activeSheet, client, column, e.target.value);
                            }}
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => setEditingCell(`${activeSheet}-${clientIndex}-${colIndex}`)}
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[24px] min-w-[50px]"
                          >
                            {currentSheet.data[client]?.[column] || ''}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Guida Import/Export:</h3>
          <div className="text-xs text-blue-700 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong className="text-blue-800">📤 Export:</strong>
                <div className="mt-1 space-y-1">
                  <div>• <strong>Esporta Tutto:</strong> Backup completo</div>
                  <div>• <strong>Esporta Clienti:</strong> Solo lista clienti</div>
                </div>
              </div>
              <div>
                <strong className="text-blue-800">📥 Import:</strong>
                <div className="mt-1 space-y-1">
                  <div>• <strong>Importa:</strong> File completo (sostituisce tutto)</div>
                  <div>• <strong>Importa Clienti:</strong> Aggiunge clienti esistenti</div>
                </div>
              </div>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <strong>Formati clienti supportati:</strong> {`{"clients": [...]}`} o {`[...]`}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Gestionale Adempimenti Fiscali - Fai clic su una cella per modificarla</p>
          <p className="mt-1 text-xs">I dati vengono salvati automaticamente nel browser</p>
        </div>
      </div>
    </div>
  );
};

export default GestionaleAdempimenti;