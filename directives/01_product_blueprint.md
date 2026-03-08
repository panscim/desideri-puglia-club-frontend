# 01 Product Blueprint

## Logica di Interazione dell'Utente

### Sblocco Monumenti Culturali (Fase Doppia)
1. **Rilevamento Passivo (GPS):** Il sistema traccia la posizione dell'utente e rileva la presenza fisica entro un raggio di **50 metri** dal monumento/POI.
2. **Azione Attiva (Sblocco):** L'effettiva acquisizione della Card non è automatica. L'utente deve eseguire un'azione consapevole nell'interfaccia (cliccare su un apposito pulsante di "Sblocco") per convalidare il check-in e collezionare la risorsa.

### Validazione Partner Commerciali (Metodo PIN)
- **Nessuna dipendenza GPS:** Per gli eventi o i check-in presso i partner commerciali (es. Vinerie, Ristoranti), la geolocalizzazione non è un fattore bloccante primario.
- **Inserimento Manuale:** La validazione e l'acquisizione della Card Premio dipendono *exclusively* dall'inserimento manuale di un **PIN Segreto** fornito dal gestore del locale all'utente in loco.
- **Esperienza SPA Immersiva:** Le pagine Partner (Partner Elite) devono comportarsi come Single Page Applications (SPA) fluide, con caricamenti istantanei, transizioni animate e stati UI reattivi (Locked/Unlocked) senza ricaricamento pagina.

### Architettura Partner Elite
- **Hero & Branding:** Hero section fissa (220px o 100dvh) con linear-gradient per fondersi con lo sfondo sandy. Logo circolare overlay (80x80) a cavallo tra hero e contenuto.
- **Benefit Card Multi-Stato:** Card bianca con shadow soft. Stati: 
  - *Locked*: Mostra teaser e tasto "Rivendica".
  - *Input*: Input PIN a 4 box interattivi.
  - *Unlocked (Success)*: Glow dorato, badge "CARD ATTIVA" e sblocco immediato del codice/vantaggio.

### Sistema di Notifiche Push
- **Guida Itinerari:** Notifiche automatiche per guidare l'utente tra le diverse tappe di un itinerario o saga.
- **Reminder Completamento:** Notifiche di ingaggio per ricordare agli utenti di completare i set di card lasciati in sospeso, migliorando la retention e la user experience.
