import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { Plus, Trash2, Edit3, Save, X, FileText, Calendar, Users, Download, Upload } from 'lucide-react';

// Tipi e costanti
const STORAGE_KEY = 'gestionale-adempimenti-fiscali';

const initialSheets = {
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

// Reducer per gestire lo stato complesso
const dataReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_DATA':
      return action.payload;
      
    case 'ADD_CLIENT':
      const newState = { ...state };
      newState.clients.push(action.payload);
      // Inizializza i dati per il nuovo cliente in tutti i fogli
      Object.keys(newState.sheets).forEach(sheetKey => {
        newState.sheets[sheetKey].data[action.payload] = {};
      });
      return newState;
      
    case 'REMOVE_CLIENT':
      const updatedState = { ...state };
      updatedState.clients = updatedState.clients.filter(c => c !== action.payload);
      // Rimuovi i dati del cliente da tutti i fogli
      Object.keys(updatedState.sheets).forEach(sheetKey => {
        delete updatedState.sheets[sheetKey].data[action.payload];
      });
      return updatedState;
      
    case 'ADD_SHEET':
      const { key, name } = action.payload;
      const stateWithNewSheet = { ...state };
      stateWithNewSheet.sheets[key] = {
        name,
        columns: ['Cliente', 'Stato', 'Note'],
        data: {}
      };
      // Inizializza i dati per tutti i clienti
      state.clients.forEach(client => {
        stateWithNewSheet.sheets[key].data[client] = {};
      });
      return stateWithNewSheet;
      
    case 'REMOVE_SHEET':
      const stateWithoutSheet = { ...state };
      delete stateWithoutSheet.sheets[action.payload];
      return stateWithoutSheet;
      
    case 'UPDATE_CELL':
      const { sheetKey, client, column, value } = action.payload;
      const cellUpdatedState = { ...state };
      if (!cellUpdatedState.sheets[sheetKey].data[client]) {
        cellUpdatedState.sheets[sheetKey].data[client] = {};
      }
      cellUpdatedState.sheets[sheetKey].data[client][column] = value;
      return cellUpdatedState;
      
    case 'ADD_COLUMN':
      const { sheetKey: sheet, columnName } = action.payload;
      const columnAddedState = { ...state };
      columnAddedState.sheets[sheet].columns.push(columnName);
      return columnAddedState;
      
    case 'REMOVE_COLUMN':
      const { sheetKey: sheetToUpdate, columnIndex } = action.payload;
      const columnRemovedState = { ...state };
      const columnToRemove = columnRemovedState.sheets[sheetToUpdate].columns[columnIndex];
      columnRemovedState.sheets[sheetToUpdate].columns.splice(columnIndex, 1);
      // Rimuovi i dati della colonna
      Object.keys(columnRemovedState.sheets[sheetToUpdate].data).forEach(client => {
        delete columnRemovedState.sheets[sheetToUpdate].data[client][columnToRemove];
      });
      return columnRemovedState;
      
    case 'UPDATE_COLUMN_NAME':
      const { sheetKey: sheetForColumn, oldName, newName } = action.payload;
      const columnUpdatedState = { ...state };
      const colIndex = columnUpdatedState.sheets[sheetForColumn].columns.indexOf(oldName);
      columnUpdatedState.sheets[sheetForColumn].columns[colIndex] = newName;
      // Aggiorna i dati
      Object.keys(columnUpdatedState.sheets[sheetForColumn].data).forEach(client => {
        if (columnUpdatedState.sheets[sheetForColumn].data[client][oldName] !== undefined) {
          columnUpdatedState.sheets[sheetForColumn].data[client][newName] = 
            columnUpdatedState.sheets[sheetForColumn].data[client][oldName];
          delete columnUpdatedState.sheets[sheetForColumn].data[client][oldName];
        }
      });
      return columnUpdatedState;
      
    default:
      return state;
  }
};

// Componenti riutilizzabili
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

// Componente principale
const GestionaleAdempimenti = () => {
  const [state, dispatch] = useReducer(dataReducer, {
    clients: [],
    sheets: initialSheets
  });
  
  const [activeSheet, setActiveSheet] = useState('dichiarazioni_redditi_2024');
  const [editingCell, setEditingCell] = useState(null);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Carica dati dal localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'INIT_DATA', payload: parsedData });
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        // Inizializza con dati di esempio se il caricamento fallisce
        dispatch({ 
          type: 'INIT_DATA', 
          payload: {
            clients: ['Mario Rossi SRL', 'Giuseppe Verdi SNC', 'Paola Bianchi'],
            sheets: initialSheets
          }
        });
      }
    } else {
      // Prima volta: inizializza con dati di esempio
      dispatch({ 
        type: 'INIT_DATA', 
        payload: {
          clients: ['Mario Rossi SRL', 'Giuseppe Verdi SNC', 'Paola Bianchi'],
          sheets: initialSheets
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

  // Gestione clienti
  const addClient = (clientName) => {
    if (state.clients.includes(clientName)) {
      alert('Cliente già esistente!');
      return;
    }
    dispatch({ type: 'ADD_CLIENT', payload: clientName });
    setShowAddClient(false);
  };

  const removeClient = (client) => {
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${client}"? Questa azione eliminerà tutti i suoi dati.`)) {
      dispatch({ type: 'REMOVE_CLIENT', payload: client });
    }
  };

  // Gestione fogli
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

  // Gestione celle
  const updateCell = useCallback((sheetKey, client, column, value) => {
    dispatch({ 
      type: 'UPDATE_CELL', 
      payload: { sheetKey, client, column, value } 
    });
    setEditingCell(null);
  }, []);

  // Gestione colonne
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

  // Export/Import
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
  };

  const currentSheet = state.sheets[activeSheet];
  if (!currentSheet) return null;

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