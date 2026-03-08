## Configurazione Parametri
- **DESIGN_VARIANCE:** 4 (Layout pulito, asimmetria bilanciata per uso esterno).
- **MOTION_INTENSITY:** 7 (Fisica Spring premium: stiffness: 120, damping: 24. Transizioni SPA tra stati locked/unlocked).
- **VISUAL_DENSITY:** 3 (Spazio bianco generoso per leggibilità sotto luce solare).
- **RADIUS_STANDARD:** 1.5rem o 2.5rem per bento cards e sezioni principali.

## Regole Ingegneristiche Critiche
- **STABILITÀ VIEWPORT (iOS/Android):** MAI usare `h-screen`. Usare SEMPRE `min-h-[100dvh]` per prevenire che la barra di navigazione di Safari/Chrome copra i pulsanti di sblocco.
- **TIPOGRAFIA ELITE:** Usare esclusivamente 'Satoshi' (Titoli Partner), 'Geist' (Body/UI) o 'Libre Baskerville' (Sezioni Narrative/Storia). Font-size per titoli: 28px min.
- **POLITICA ANTI-EMOJI:** MAI usare emoji nel codice o nel contenuto (tranne logica di stato se necessario). Sostituire con icone Lucide o Phosphor.
- **LIQUID GLASS & BENTO:** Utilizzare card bianche con shadow soft e bordi 1px (`border-[#E5E7EB]`). Layout a bento grid (1 o 2 colonne) per sezioni pratiche (mappe, contatti).
- **STICKY PATTERNS:** Il Floating Action Button (FAB) principale deve apparire dopo lo scroll oltre l'hero, garantendo la call-to-action sempre visibile.
- **NO NERO PURO:** Usare Zinc-900 o Zinc-950 per i testi e sfondi scuri.
- **MASK-IMAGE TRUNCATION:** Per testi lunghi (storie), usare `mask-image` linear-gradient per sfumare il testo verso il basso invece di un taglio netto.