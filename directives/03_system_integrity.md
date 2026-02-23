# 03 System Integrity & Execution

## Gestione Esecuzioni e Auto-Correzione

Questa SOP norma il comportamento della directory `execution/` e le direttive di manutenzione e problem-solving autonomo del sistema.

### Regole della directory `execution/`
- Tutti gli script operativi (es. script di seeding database, batch operations, migrazioni) devono risiedere nella struttura `execution/`.
- **Qualità del Codice:** Ogni script in questa directory DEVE essere esaustivamente commentato, documentato e testabile in isolamento senza corrompere la produzione.

### Loop di Auto-Correzione (Self-Healing)
In caso di fallimento di un'operazione su Database (es. API Supabase) o di interazione con i file di sistema, l'agente dovrà adottare la eguente procedura deterministica:
1. **Analisi:** Catturare e analizzare lo stack trace dell'errore.
2. **Modifica Isolata:** Modificare autonomamente lo script o il componente difettoso.
3. **Test Sandbox:** Testare la solidità della soluzione creata in un ambiente protetto (es. cartella `.tmp/` o tramite script node temporanei).
4. **Validazione e Commit:** Applicare l'aggiornamento e inviarlo solo previa dimostrazione del successo nel sandbox.

### Aggiornamento delle Direttive
Ogni nuovo limite tecnico strutturale, anomalia ricorrente o paradigma architetturale scoperto durante la fase di Auto-Correzione deve tradursi *immediatamente* in un aggiornamento formale di queste direttive, affinché la knowledge base resti sincronizzata con lo stato reale del software.
