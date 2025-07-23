# Gestionale Adempimenti Fiscali 📊

Un'applicazione web per la gestione delle scadenze e degli adempimenti fiscali per studi di commercialisti, basata su React e Tailwind CSS.

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.2-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)

## 🚀 Caratteristiche

- **Gestione Clienti**: Aggiungi, modifica ed elimina clienti con facilità
- **Fogli Multipli**: Crea fogli separati per ogni tipo di adempimento (Dichiarazioni Redditi, Bilanci, IVA, 770, etc.)
- **Colonne Personalizzabili**: Aggiungi, rinomina o rimuovi colonne secondo le tue esigenze
- **Editing In-Place**: Modifica i dati direttamente nella tabella con un click
- **Persistenza Locale**: I dati vengono salvati automaticamente nel browser
- **Import/Export**: Salva e carica i tuoi dati in formato JSON
- **Interfaccia Intuitiva**: Design moderno e responsivo con Tailwind CSS

## 📋 Prerequisiti

- Node.js (versione 14 o superiore)
- npm o yarn

## 🛠️ Installazione

1. Clona il repository:
```bash
git clone https://github.com/tuousername/gestionale-adempimenti-fiscali.git
cd gestionale-adempimenti-fiscali
```

2. Installa le dipendenze:
```bash
npm install
# oppure
yarn install
```

3. Avvia l'applicazione in modalità sviluppo:
```bash
npm run dev
# oppure
yarn dev
```

4. Apri il browser su [http://localhost:5173](http://localhost:5173)

## 🏗️ Struttura del Progetto

```
gestionale-adempimenti-fiscali/
├── src/
│   ├── components/
│   │   └── GestionaleAdempimenti.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 📖 Utilizzo

### Gestione Clienti
- Clicca su "Aggiungi Cliente" per inserire un nuovo cliente
- Clicca sulla X accanto al nome per rimuovere un cliente

### Gestione Fogli
- Usa i tab per navigare tra i diversi adempimenti
- Clicca su "Nuovo Foglio" per creare un nuovo tipo di adempimento
- Clicca sulla X sul tab per eliminare un foglio

### Gestione Dati
- Clicca su qualsiasi cella per modificare il contenuto
- Premi Enter o clicca fuori dalla cella per salvare
- Usa "Aggiungi Colonna" per aggiungere nuovi campi

### Import/Export
- Clicca su "Esporta" per salvare tutti i dati in un file JSON
- Clicca su "Importa" per caricare dati da un file precedentemente salvato

## 🔧 Configurazione

L'applicazione salva automaticamente i dati nel localStorage del browser. Per modificare questa impostazione o aggiungere un backend, modifica il file `GestionaleAdempimenti.jsx`.

## 🚧 Sviluppi Futuri

- [ ] Sistema di autenticazione utenti
- [ ] Backend con database
- [ ] Notifiche per scadenze imminenti
- [ ] Vista calendario degli adempimenti
- [ ] Report e statistiche
- [ ] Esportazione in Excel/PDF
- [ ] Supporto multi-studio
- [ ] App mobile

## 🤝 Contribuire

Le pull request sono benvenute! Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

1. Fork il progetto
2. Crea il tuo branch (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori informazioni.

## 👨‍💻 Autore

**Il tuo nome**
- GitHub: [@tuousername](https://github.com/tuousername)
- Email: tua@email.com

## 🙏 Ringraziamenti

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vite](https://vitejs.dev/)