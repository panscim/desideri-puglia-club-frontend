# 02 Performance & Data Intelligence SOP

## Vincoli di Ottimizzazione Infrastrutturale (Tassativi)
Al fine di garantire che la telemetria raccolga informazioni continue durante il touring off-grid in piccoli Comuni o paesaggi rurali pugliesi senza ostacolare l'esperienza:
- **Latenza Massima:** La velocità di caricamento dell'interfaccia e fetching dati non deve *mai* superare la soglia di **2 secondi su reti stimate 4G**.
- **Resilience e Local Caching:** L'applicazione DEVE incorporare l'obbligo di caching locale (es. IndexedDB, SQLite o Service Workers). La consultazione delle carte sbloccate e la coda di sincronizzazione degli eventi fisici *devono* operare anche in modalità aereo/offline, riversando i dati collezionati (Unlock ed Analytics Dwell Time) in background non appena la rete torna disponibile.

---

## Strategia di Raccolta Dati Turistici

Questa SOP definisce le direttive per la raccolta dei dati telemetrici e comportamentali volti alla creazione di asset commerciali per Comuni ed Enti Pubblici, nel rigoroso rispetto del GDPR.

### Tracciamento e Log Silenziosi
- **Percorsi Turistici:** Il sistema dovrà registrare passivamente (in background, se autorizzato) i log relativi agli spostamenti aggregati tra i vari Punti di Interesse (POI) e Monumenti.
- **Tempo di Sosta (Dwell Time):** Calcolo e storicizzazione del tempo trascorso da un utente all'interno del raggio d'azione di un POI.

### Trasformazione e Business Intelligence
- **Heatmaps (Mappe di Calore):** I flussi di posizione grezzi devono essere periodicamente aggregati per generare layer visivi (heatmaps) dell'affollamento turistico e dei percorsi preferenziali.
- **Report Statistici:** Elaborazione di reportistica su base oraria, giornaliera e mensile riguardo l'efficacia dei percorsi, per supportare la pianificazione urbana degli Enti Pubblici.

### Conformità GDPR e Privacy
- **Anonimizzazione Nativa:** Tutti i dati posizionali e di dwell time devono essere crittografati e dissociati dall'identità reale (PII) dell'utente alla fonte.
-I log posizionali conterranno solo session IDs temporanei o identificatori di macrohorte, rendendo impossibile il tracciamento del singolo individuo nel tempo per scopi non autorizzati.
- I dati così normalizzati sono pronti ad essere aggregati e monetizzati senza rischi legali.
