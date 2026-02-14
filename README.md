# 🏖️ Desideri di Puglia Club

App web completa (PWA, mobile-first, responsive) per il B&B "Desideri di Puglia" di Barletta.

## 📋 Caratteristiche

- ✅ Sistema di autenticazione (registrazione/login)
- ✅ Profili utente personalizzabili
- ✅ Sistema missioni con prove da verificare
- ✅ Sistema punti e livelli (10 livelli)
- ✅ Classifica mensile competitiva
- ✅ Chat community in tempo reale
- ✅ Premi mensili
- ✅ Area admin per gestione completa
- ✅ Design mobile-first responsive
- ✅ Palette colori ispirata alla Puglia

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** per lo styling
- **React Router** per la navigazione
- **Lucide React** per le icone
- **React Hot Toast** per le notifiche

### Backend
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)

## 🚀 Setup Rapido

### 1. Crea Account Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Crea un account gratuito
3. Crea un nuovo progetto:
   - Nome: `desideri-puglia-club`
   - Password database: (salvala!)
   - Region: Europe (Frankfurt o London)

### 2. Configura il Database

1. Nel dashboard Supabase, vai su **SQL Editor**
2. Crea una nuova query
3. Copia e incolla il contenuto di `database-schema.sql`
4. Esegui la query

Questo creerà:
- Tutte le tabelle necessarie
- Politiche di sicurezza (RLS)
- Trigger automatici
- Dati di esempio (5 missioni iniziali)

### 3. Ottieni le Credenziali

1. Nel dashboard Supabase, vai su **Settings** → **API**
2. Copia:
   - **Project URL** (tipo: `https://xxxxx.supabase.co`)
   - **Anon/public key** (chiave pubblica)

### 4. Configura l'App

```bash
cd frontend

# Copia il file .env.example
cp .env.example .env

# Modifica .env con i tuoi dati:
# VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
# VITE_SUPABASE_ANON_KEY=tua-chiave-pubblica
```

### 5. Installa e Avvia

```bash
# Installa dipendenze (già fatto se hai seguito la guida)
npm install

# Avvia l'app in modalità sviluppo
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

## 📱 Struttura Pagine

### Pubbliche
- `/login` - Accesso
- `/register` - Registrazione

### Protette (richiede login)
- `/dashboard` - Home con statistiche e missioni del giorno
- `/missioni` - Elenco completo missioni
- `/missione/:id` - Dettaglio missione con form invio
- `/classifica` - Leaderboard mensile
- `/chat` - Chat community
- `/profilo` - Profilo personale
- `/admin` - Area amministrativa (solo admin/moderatori)

## 👥 Ruoli Utente

### Utente
- Visualizza e completa missioni
- Guadagna punti e sale di livello
- Partecipa alla chat
- Visualizza classifica

### Admin / Moderatore
- Tutte le funzioni dell'utente
- Crea e gestisce missioni
- Approva/rifiuta prove inviate
- Gestisce premi mensili
- Modera chat e utenti

## 🎮 Sistema di Livelli

10 livelli basati sui punti totali:

1. **Guest** (0-49 pt) 🌱
2. **Local Lover** (50-119 pt) 💚
3. **Sea Stroller** (120-199 pt) 🌊
4. **Olive Grove Fan** (200-299 pt) 🫒
5. **Apulian Explorer** (300-449 pt) 🧭
6. **Heritage Seeker** (450-649 pt) 🏛️
7. **Coastal Connoisseur** (650-899 pt) ⛵
8. **Authenticity Ambassador** (900-1199 pt) ✨
9. **Puglia Virtuoso** (1200-1599 pt) 👑
10. **Legend of Puglia** (1600+ pt) 🏆

## 🎨 Palette Colori

- **Warm White**: `#FFFDF8` - Sfondo base
- **Olive Light**: `#B8B48F` - Accenti naturali
- **Sand**: `#EDE6D6` - Sfondi neutri
- **Olive Dark**: `#5A5A40` - Testo e bottoni
- **Gold**: `#D6A75D` - Badge e premi
- **Coral**: `#D47B7B` - Errori e alert

## 🔐 Sicurezza

L'app usa:
- **Row Level Security (RLS)** di Supabase
- JWT tokens per autenticazione
- Politiche di accesso granulari
- Protezione CSRF integrata

## 📦 Deployment

### Opzione 1: Netlify (Consigliato)

1. Crea account su [netlify.com](https://netlify.com)
2. Collega il repository GitHub
3. Configura:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
4. Aggiungi variabili d'ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Opzione 2: Vercel

1. Crea account su [vercel.com](https://vercel.com)
2. Importa il progetto
3. Configura root directory: `frontend`
4. Aggiungi variabili d'ambiente

## 🔧 Configurazione Avanzata

### Creare il Primo Admin

Dopo la registrazione del primo utente:

1. Vai su Supabase → **Table Editor** → `utenti`
2. Trova l'utente
3. Modifica il campo `ruolo` da `Utente` a `Admin`

### Personalizzare le Missioni

Vai su `/admin/missioni` per:
- Creare nuove missioni
- Modificare quelle esistenti
- Attivare/disattivare missioni
- Impostare cooldown e punti

### Configurare i Premi Mensili

Vai su `/admin/premi` per:
- Impostare premi per i primi 3 classificati
- Aggiungere immagini e descrizioni
- Definire termini e condizioni

## 🐛 Troubleshooting

### Errore: "Failed to fetch"
- Verifica che le credenziali Supabase in `.env` siano corrette
- Controlla che il database sia configurato correttamente

### Errore: "User already registered"
- L'email è già in uso
- Prova con un'altra email o fai login

### Problemi con RLS
- Verifica che le politiche RLS siano state create
- Controlla i log in Supabase → **Logs**

## 📚 Prossimi Step

### Funzionalità da Implementare
- [ ] Panel Admin completo
- [ ] Upload immagini profilo
- [ ] Notifiche push (PWA)
- [ ] Sistema badge speciali
- [ ] Missioni segrete
- [ ] Integrazione Google Maps
- [ ] Export classifica PDF
- [ ] Sistema referral

### Ottimizzazioni
- [ ] Caching strategico
- [ ] Lazy loading immagini
- [ ] Service Worker per offline
- [ ] Ottimizzazione bundle size

## 📄 Licenza

Questo progetto è stato creato per Desideri di Puglia B&B.

## 🤝 Supporto

Per domande o supporto:
- Email: info@desideridipuglia.it
- Instagram: @desideridipuglia

---

**Fatto con ❤️ per la Puglia**
