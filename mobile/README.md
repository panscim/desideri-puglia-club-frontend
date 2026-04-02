# Mobile App

Questa cartella ospita il client mobile Expo della stessa piattaforma.

## Obiettivo

- tenere il web attuale per Vercel, partner dashboard e backoffice
- aprire un client nativo per App Store e Play Store
- riusare Supabase, contenuti e logica prodotto gia` presenti

## Avvio

1. Copia `mobile/.env.example` in `mobile/.env`
2. Inserisci:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Installa le dipendenze:
   - `npm install`
4. Avvia:
   - `npm run dev:mobile`

## Primo scope mobile

- accesso utente con Supabase
- home nativa
- eventi
- itinerari
- profilo

## Step successivi

- navigazione nativa vera
- dettagli evento e itinerario
- partner hub mobile
- QR scanner
- notifiche push
- EAS build per iOS e Android
