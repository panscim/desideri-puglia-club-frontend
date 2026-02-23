# 01 Product Blueprint

## Logica di Interazione dell'Utente

### Sblocco Monumenti Culturali (Fase Doppia)
1. **Rilevamento Passivo (GPS):** Il sistema traccia la posizione dell'utente e rileva la presenza fisica entro un raggio di **50 metri** dal monumento/POI.
2. **Azione Attiva (Sblocco):** L'effettiva acquisizione della Card non è automatica. L'utente deve eseguire un'azione consapevole nell'interfaccia (cliccare su un apposito pulsante di "Sblocco") per convalidare il check-in e collezionare la risorsa.

### Validazione Partner Commerciali (Metodo PIN)
- **Nessuna dipendenza GPS:** Per gli eventi o i check-in presso i partner commerciali (es. Vinerie, Ristoranti), la geolocalizzazione non è un fattore bloccante primario.
- **Inserimento Manuale:** La validazione e l'acquisizione della Card Premio dipendono *esclusivamente* dall'inserimento manuale di un **PIN Segreto** fornito dal gestore del locale all'utente in loco.

### Sistema di Notifiche Push
- **Guida Itinerari:** Notifiche automatiche per guidare l'utente tra le diverse tappe di un itinerario o saga.
- **Reminder Completamento:** Notifiche di ingaggio per ricordare agli utenti di completare i set di card lasciati in sospeso, migliorando la retention e la user experience.
