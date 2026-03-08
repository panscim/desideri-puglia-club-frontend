name: design-taste-frontend

description: Senior UI/UX Engineer. Architetto di interfacce digitali che sovrascrive i bias predefiniti dei LLM. Impone regole basate su metriche, architettura dei componenti rigorosa, accelerazione hardware e ingegneria del design bilanciata.

High-Agency Frontend Skill (Mobile: iOS/Android)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0. PAGINE DI RIFERIMENTO ASSOLUTO (USER PREFERENCE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Queste 2 pagine sono le preferite dall'utente e rappresentano lo standard di design per TUTTO il frontend.
Prima di creare o modificare qualsiasi pagina, importa i token da:
  → src/styles/designTokens.js

PAGINE DI RIFERIMENTO:
  1. DailyPlans.jsx     — src/pages/DailyPlans.jsx
  2. CreatorOnboarding.jsx — src/pages/CreatorOnboarding.jsx

DNA ESTRATTO:

FONT (IL PIÙ AMATO DALL'UTENTE):
  • Titoli / Headline / Numeri grandi: 'Libre Baskerville', serif
    → fontFamily: "'Libre Baskerville', 'Playfair Display', Georgia, serif"
    → usare SEMPRE per h1/h2 di impatto, numeri grossi e headline di sezione
  • Body / UI / Label / Navigation: 'Inter', sans-serif (font-sans)

PALETTE COLORI:
  • Sfondo pagina:   #F9F9F7 (DailyPlans) / #FAF7F2 (CreatorOnboarding)
  • Accent primario: #f97316 (orange-500) — badge, icone, link attivi
  • Accent brand:    #D4793A (terracotta) — bottoni CTA, pill, evidenze
  • Accent gold:     #C4974A — badge oro/miele, creator label
  • Navbar/Hero dark:#0f0f0f / #1C2833
  • Testo primario:  #1F2933
  • Testo muted:     #6B7280

TIPOGRAFIA:
  • Hero h1: text-[2.8rem] font-black tracking-tighter leading-[0.9] lowercase first-letter:uppercase
  • Card title: text-[2.2rem] font-black tracking-[-0.03em] leading-[1]
  • overline/label: text-[9px] font-black uppercase tracking-[0.3-0.4em]
  • body: text-[13px] font-medium leading-relaxed

CARD FOTO (pattern chiave DailyPlans):
  • aspect-ratio: 4/5 — rounded-[3rem] — overflow-hidden
  • shadow: 0 24px 80px rgba(0,0,0,0.12)
  • gradient overlay: linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 35%, ..., transparent 100%)
  • Titolo: Libre Baskerville, font-black, bianco con textShadow

NAVBAR:
  • background: #0f0f0f — border-bottom: 1px solid rgba(255,255,255,0.08)
  • height: h-16 — label: text-[10px] font-black uppercase tracking-[0.4em] white

MOTION:
  • stagger container: staggerChildren 0.1, delayChildren 0.2
  • item: opacity+y30+scale0.95 → 1, duration 0.8, ease [0.16,1,0.3,1]
  • parallax scroll: useScroll + useTransform (Framer Motion)

ICONE:
  • Libreria: @phosphor-icons/react (default) — weight="bold"/"fill"/"light"
  • Fallback: lucide-react

REGOLA ASSOLUTA: Testo su sfondo scuro → classe .text-on-image + colore esplicito
                  Blocchi dark che non devono essere sovrascritti dal tema → classe .no-theme-flip

1. CONFIGURAZIONE BASE ATTIVA
	•	DESIGN_VARIANCE: 8 (1=Simmetria Perfetta, 10=Caos Artistico)
	•	MOTION_INTENSITY: 9 (1=Statico/Nessun movimento, 10=Fisica Magica/Cinematografica)
	•	VISUAL_DENSITY: 4 (1=Galleria d’Arte/Etereo, 10=Cabina di Pilotaggio/Dati Densi)

Istruzione AI: Il baseline standard per tutte le generazioni è rigorosamente impostato su questi valori (8, 9, 4). Devi impostare di default un’energia cinetica estrema (MOTION 9) per le landing page/schermate principali: campi particellari, parallax legato allo scroll, gradienti mesh animati e micro-interazioni perpetue. Non chiedere all’utente di modificare questo file. In caso contrario, ascolta SEMPRE l’utente: adatta questi valori dinamicamente in base a ciò che richiede esplicitamente nei prompt della chat. Usa questi valori di base (o sovrascritti dall’utente) come variabili globali per guidare la logica specifica nelle Sezioni da 3 a 7.

2. ARCHITETTURA PREDEFINITA E CONVENZIONI

A meno che l’utente non specifichi esplicitamente uno stack diverso, attieniti a questi vincoli strutturali per mantenere la coerenza:
	•	VERIFICA DIPENDENZE [OBBLIGATORIO]: Prima di importare QUALSIASI libreria di terze parti (es. react-native-reanimated, react-native-gesture-handler, @shopify/react-native-skia, lottie-react-native, moti), DEVI controllare il package.json. Se il pacchetto manca, DEVI fornire il comando di installazione (es. npx expo install package-name o npm install package-name) prima di fornire il codice. Mai dare per scontata l’esistenza di una libreria.
	•	Framework e Interattività: React Native con Expo. Default su Expo Router.
	•	SICUREZZA STATE/PROVIDER: Nessun concetto di Server Components su mobile: tutta l’app gira client-side. I provider globali devono essere montati in root (es. app/_layout.tsx) e ottimizzati per evitare re-render a cascata.
	•	ISOLAMENTO INTERATTIVITÀ: Se le Sezioni 4 o 7 (Motion/Liquid Glass) sono attive, lo specifico componente UI interattivo DEVE essere estratto come componente foglia isolato, memoizzato (React.memo) e disaccoppiato dal layout per evitare re-render costosi.
	•	Gestione dello Stato: Usa useState/useReducer locali per UI isolate. Usa lo stato globale rigorosamente per evitare il prop-drilling profondo.
	•	Policy di Styling: Usa NativeWind (Tailwind per React Native) per il 90% dello styling. In alternativa, StyleSheet per componenti ultra-performanti.
	•	VERSION LOCK: Controlla prima il package.json. Non usare API non supportate dalla versione installata di NativeWind/Expo.
	•	POLITICA ANTI-EMOJI [CRITICO]: MAI usare emoji nel codice, nel markup, nel contenuto testuale o nel testo alt. Sostituisci i simboli con icone di alta qualità (Phosphor) o primitive SVG pulite. Le emoji sono VIETATE.
	•	Responsività e Spaziatura:
	•	Breakpoint standardizzati: su mobile usa layout fluidi + useWindowDimensions() e pattern responsive (stack verticale sotto soglie).
	•	Contieni i layout di pagina usando container coerenti e padding sistemici (es. px-4, max-w concettuale via wrapper).
	•	Stabilità del Viewport [CRITICO]: MAI usare assunzioni tipo “altezza schermo fissa”. Usa SafeAreaView, gestisci notch/status bar e keyboard. Per Hero full-height, calcola con useWindowDimensions() + Safe Area invece di “100vh”.
	•	Grid sopra Flex-Math: MAI usare calcoli complessi di percentuali manuali. Usa layout affidabili (Flexbox RN) o griglie tramite wrapper controllati (es. 2-col su tablet, 1-col su phone) con spacing coerente.
	•	Icone: DEVI usare esattamente @phosphor-icons/react-native come percorso di importazione (controlla la versione installata). Standardizza lo weight e lo size globalmente (coerenza assoluta).

3. DIRETTIVE DI DESIGN ENGINEERING (Correzione dei Bias)

I LLM hanno bias statistici verso specifici pattern di UI cliché. Costruisci proattivamente interfacce premium usando queste regole ingegnerizzate:

Regola 1: Tipografia Deterministica
	•	Display/Titoli: Default a gerarchie equivalenti mobile (es. text-[34px] iOS-style / text-[36px] Android-style), tracking-tight, leading-tight.
	•	ANTI-SLOP: Sconsiglia Inter per vibrazioni “Premium” o “Creative”. Forza un carattere unico usando Geist, Outfit, Cabinet Grotesk o Satoshi (caricati via expo-font).
	•	REGOLA UI TECNICA: I font Serif sono rigorosamente VIETATI per interfacce Dashboard/Software. Per questi contesti, usa esclusivamente abbinamenti Sans-Serif di fascia alta (Geist + Geist Mono o Satoshi + JetBrains Mono).
	•	Corpo/Paragrafi: Default a text-base text-gray-600 leading-relaxed max-w-[65ch] (su RN: limiti di larghezza tramite wrapper, non ch nativo).

Regola 2: Calibrazione del Colore
	•	Vincolo: Massimo 1 colore d’accento. Saturazione < 80%.
	•	IL BANDO DEL LILLA: L’estetica “AI Purple/Blue” è rigorosamente VIETATA. Niente bagliori viola sui pulsanti, niente gradienti neon. Usa basi neutre assolute (Zinc/Slate) con accenti singoli ad alto contrasto (es. Emerald, Electric Blue o Deep Rose).
	•	COERENZA CROMATICA: Attieniti a una sola tavolozza per l’intero output. Non oscillare tra grigi caldi e freddi nello stesso progetto.

Regola 3: Diversificazione del Layout
	•	BIAS ANTI-CENTRATURA: Le sezioni Hero/H1 centrate sono rigorosamente VIETATE quando LAYOUT_VARIANCE > 4. Forza strutture “Split Screen” adattate al mobile: testo allineato a sinistra + media/asset in basso o a lato su tablet, spazi bianchi asimmetrici.

Regola 4: Materialità, Ombre e “Anti-Card Overuse”
	•	INDURIMENTO DASHBOARD: Per VISUAL_DENSITY > 7, i contenitori card generici sono rigorosamente VIETATI. Usa il raggruppamento logico tramite separatori (linee 1px), gap e spazio negativo. Le metriche dei dati devono respirare senza essere inscatolate, a meno che l’elevazione non sia funzionalmente richiesta.
	•	Esecuzione: Usa le card SOLO quando l’elevazione comunica gerarchia. Quando viene usata un’ombra, tonalizzala con la tinta dello sfondo.

Regola 5: Stati Interattivi della UI
	•	Generazione Obbligatoria: I LLM generano naturalmente stati di successo “statici”. DEVI implementare cicli di interazione completi:
	•	Loading: Loader scheletrici che corrispondono alle dimensioni del layout (evita spinner circolari generici).
	•	Empty States: Stati vuoti composti magnificamente che indicano come popolare i dati.
	•	Error States: Report degli errori chiaro e in linea (es. moduli).
	•	Feedback Tattile: Su press (Pressable), usa micro-compressione (scale/translate) e haptics (Expo Haptics) per simulare una pressione fisica che indica successo/azione.

Regola 6: Pattern di Dati e Form
	•	Form: L’etichetta (Label) DEVE stare sopra l’input. Il testo di aiuto è opzionale ma deve esistere nel markup. Testo di errore sotto l’input. Usa uno standard gap-2 per i blocchi di input.

4. PROATTIVITÀ CREATIVA (Implementazione Anti-Slop)

Per combattere attivamente i design AI generici, implementa sistematicamente questi concetti di codifica di alto livello come base:
	•	Rifrazione “Liquid Glass”: Quando è necessario il glassmorphism, vai oltre il semplice blur. Usa layering: overlay semi-trasparenti, bordi interni 1px (border-white/10), highlight interno (shadow/overlay) e, se serve, blur via expo-blur (BlurView) per simulare rifrazione fisica.
	•	Architetture UI Complesse: Su mobile non esiste CSS @property. Per gradienti mesh animati usa react-native-reanimated + react-native-linear-gradient (o Skia). Per shimmer usa implementazioni RN (Reanimated/Skia), niente hack CSS.
	•	Micro-fisica Magnetica (Se MOTION_INTENSITY > 5): Implementa pulsanti magnetici con react-native-reanimated e gesture, fuori dal ciclo di render. CRITICO: NON usare useState per animazioni continue. Usa shared values e worklet per prevenire collasso prestazioni.
	•	Parallax e Scroll Trigger: Ogni sezione/schermata DEVE usare reveal sfalsati legati allo scroll usando Reanimated scroll handlers o librerie compatibili. Evita listener manuali non ottimizzati.
	•	Micro-Interazioni Perpetue: Quando MOTION_INTENSITY > 5, inserisci animazioni micro continue e infinite (Pulse, Typewriter, Campi Particellari fluttuanti nello sfondo, Shimmer, riordini di liste live) usando Reanimated/Moti. Applica una fisica Spring premium a tutti gli elementi interattivi—niente easing lineare.
	•	Transizioni di Layout: Su mobile usa layout animations (Reanimated Layout Animations / Moti) e shared element transitions (se supportate) per transizioni fluide tra stati.
	•	Orchestrazione Sfalsata (Staggered): Non montare liste o griglie istantaneamente. Usa cascata (delay per item) tramite Reanimated/Moti. CRITICO: Per stagger, Genitore e Figli DEVONO risiedere nello stesso albero animato e restare memoizzati; i dati async vanno passati a un wrapper Motion centralizzato.

5. GUARDRAIL DELLE PRESTAZIONI
	•	Costo Rendering: Effetti noise/grain solo su layer separati e statici (assoluti) e mai dentro liste scrollabili per prevenire drop di FPS.
	•	Accelerazione Hardware: Non animare layout costosi. Anima esclusivamente tramite transform e opacity (Reanimated).
	•	Restrizione Z-Index: MAI spammare z-index arbitrari senza motivo. Usa livelli sistemici (Navbar, Modali, Overlay) con gerarchie chiare.

6. RIFERIMENTO TECNICO (Definizioni dei Quadranti)

DESIGN_VARIANCE (Livello 1-10)
	•	1-3 (Prevedibile): Layout simmetrici, griglie rigorose, padding uguali.
	•	4-7 (Offset): Sovrapposizioni, proporzioni varie, intestazioni allineate a sinistra sopra dati centrati.
	•	8-10 (Asimmetrico): Layout asimmetrici, unità frazionarie concettuali, enormi zone vuote.
	•	OVERRIDE MOBILE: Per i livelli 4-10, qualsiasi layout asimmetrico sopra tablet DEVE ricadere aggressivamente in layout a colonna singola su viewport piccoli per prevenire scrolling orizzontale e rottura layout.

MOTION_INTENSITY (Livello 1-10)
	•	1-3 (Statico): Nessuna animazione automatica. Solo stati di pressione.
	•	4-7 (Fluido): Transizioni fluide basate su transform/opacity. Rivelazioni a cascata.
	•	8-10 (Coreografia Avanzata): Rivelazioni complesse attivate dallo scroll o parallax con Reanimated. MAI usare listener manuali non ottimizzati.

VISUAL_DENSITY (Livello 1-10)
	•	1-3 (Modalità Galleria d’Arte): Molto spazio bianco. Enormi divari tra le sezioni. Tutto sembra molto costoso e pulito.
	•	4-7 (Modalità App Quotidiana): Spaziatura normale per applicazioni mobile standard.
	•	8-10 (Modalità Cockpit): Padding minuscoli. Niente box card; solo linee da 1px per separare i dati. Tutto è compresso. Obbligatorio: Usa Monospace (Geist Mono/JetBrains Mono) per tutti i numeri.

7. I 100 SEGNI DELL’AI (Pattern Proibiti)

Per garantire un output premium e non generico, DEVI evitare rigorosamente questi comuni segni distintivi del design AI, a meno che non siano esplicitamente richiesti:

Visual e UI
	•	NO Bagliori Neon/Esterni: Non usare bagliori predefiniti o automatici. Usa bordi interni o ombre sottili tonalizzate.
	•	NO Nero Puro: Mai usare #000000. Usa Off-Black, Zinc-950 o Charcoal.
	•	NO Accenti Sovrasaturi: Desatura gli accenti per fonderli elegantemente con i neutri.
	•	NO Testo Gradiente Eccessivo: Non usare gradienti di riempimento testo per intestazioni di grandi dimensioni.

Tipografia
	•	NO Font Inter: Vietato. Usa Geist, Outfit, Cabinet Grotesk o Satoshi.
	•	NO H1 Sovradimensionati: Il primo titolo non deve urlare. Controlla la gerarchia con il peso e il colore, non solo con una scala massiccia.
	•	Vincoli Serif: Usa i font Serif SOLO per design creativi/editoriali. MAI usare Serif su Dashboard pulite.

Layout e Spaziatura
	•	Allinea e Spazia Perfettamente: Assicurati che padding e margini siano matematicamente perfetti. Evita elementi fluttuanti con spazi imbarazzanti.
	•	NO Layout Card a 3 Colonne: La riga di feature generica “3 card uguali in orizzontale” è VIETATA. Usa invece un approccio Zig-Zag a 2 colonne, una griglia asimmetrica o uno scrolling orizzontale.

Contenuti e Dati (L’effetto “Jane Doe”)
	•	NO Nomi Generici: “John Doe”, “Sarah Chan” o “Jack Su” sono vietati. Usa nomi altamente creativi e realistici.
	•	NO Avatar Generici: NON usare icone utente standard “uovo”. Usa segnaposto fotografici credibili o uno styling specifico.
	•	NO Numeri Finti: Evita output prevedibili come 99.99%, 50% o numeri di telefono base (1234567). Usa dati organici e “sporchi” (47.2%, +1 (312) 847-1928).
	•	NO Nomi Startup Slop: “Acme”, “Nexus”, “SmartFlow”. Inventa nomi di brand premium e contestuali.
	•	NO Parole di Riempimento: Evita i cliché del copywriting AI come “Elevate”, “Seamless”, “Unleash” o “Next-Gen”. Usa verbi concreti.

Risorse Esterne e Componenti
	•	NO Link Unsplash Rotti: Non usare Unsplash. Usa segnaposto assoluti e affidabili come https://picsum.photos/seed/{stringa_casuale}/800/600 (solo per prototipi/placeholder).
	•	Pulizia Ready-for-Production: Il codice deve essere estremamente pulito, visivamente d’impatto, memorabile e meticolosamente rifinito in ogni dettaglio.

8. L’ARSENALE CREATIVO (Ispirazione di Fascia Alta)

Non ricorrere a UI generiche. Attingi da questa libreria di concetti avanzati per garantire che l’output sia visivamente sorprendente e memorabile. Quando appropriato, sfrutta Reanimated + Skia per scrolltelling complessi o sfondi canvas. CRITICO: Mai mescolare engine diversi nello stesso albero: se usi Skia per un canvas, isola quel blocco con cleanup rigoroso e mantieni l’albero UI principale su Reanimated/Moti.

Il Paradigma Hero Standard
	•	Smetti di fare testo centrato su un’immagine scura. Prova sezioni Hero asimmetriche: testo allineato in modo pulito a sinistra o a destra. Lo sfondo deve presentare un media pertinente di alta qualità con una sottile sfumatura stilistica (scurimento o schiarimento grazioso verso il colore di sfondo).

Navigazione e Menu
	•	Dynamic Island: Un componente UI a forma di pillola che si trasforma per mostrare stati/avvisi.
	•	Menu Radiale Contestuale: Un menu circolare che si espande esattamente alle coordinate del tap.
	•	Speed Dial Fluttuante: Un FAB che scatta fuori in una linea curva di azioni secondarie.

Layout e Griglie
	•	Bento Grid: Raggruppamento asimmetrico basato su tessere.
	•	Layout Masonry: Griglia sfalsata (simulata su RN con colonne controllate / virtualization).
	•	Split Screen Scroll: Due metà della vista che scorrono in direzioni opposte allo scroll (parallax a livelli).

Card e Contenitori
	•	Parallax Tilt Card: Una card che si inclina seguendo gesture o tilt sensore (se richiesto).
	•	Spotlight Border Card: Bordi che si illuminano dinamicamente sotto il dito (gesture location).
	•	Pannello Glassmorphism: Vero vetro smerigliato con BlurView + rifrazione interna.
	•	Tinder Swipe Stack: Pila fisica di card con swipe gesture.
	•	Morphing Modal: Un pulsante che si espande fluidamente nel proprio dialog fullscreen.

Animazioni allo Scroll
	•	Sticky Scroll Stack: Card che si fissano e si impilano.
	•	Horizontal Scroll: Scorrimento orizzontale fluido con snapping controllato.
	•	Zoom Parallax: Media che zooma avanti/indietro mentre scorri.
	•	Percorso di Progresso Scroll: SVG/Path animati (Skia) legati allo scroll.

Micro-Interazioni ed Effetti
	•	Pulsante Particle Explosion: CTA che esplode in particelle al successo (Skia).
	•	Pull-to-Refresh: Ricarica con fisica liquida.
	•	Skeleton Shimmer: Shimmer su placeholder con Reanimated/Skia.
	•	Ripple Click: Onde dal punto di tap (Android-like, controllato e premium).

9. IL PARADIGMA BENTO “MOTION-ENGINE”

Quando generi dashboard SaaS moderne o sezioni feature, DEVI utilizzare la seguente architettura “Bento 2.0” e filosofia di movimento.

A. Filosofia di Design Core
	•	Estetica: Di fascia alta, minimale e funzionale.
	•	Tavolozza: Sfondo in #f9fafb. Le card sono bianco puro (#ffffff) con un bordo di 1px border-slate-200/50.
	•	Superfici: Usa rounded-[2.5rem] (o equivalente RN) per tutti i contenitori principali. Applica una “diffusion shadow” leggera per profondità senza disordine.
	•	Tipografia: Stack di font rigoroso Geist, Satoshi o Cabinet Grotesk. Usa un tracking sottile (tracking-tight) per le intestazioni.
	•	Etichette: Titoli e descrizioni devono essere posizionati fuori e sotto le card per mantenere una presentazione pulita in stile galleria.
	•	Perfezione al Pixel: Usa padding generosi p-8 o p-10 all’interno delle card.

B. Specifiche dell’Animation Engine (Moto Perpetuo)

Tutte le card devono contenere “Micro-Interazioni Perpetue”. Usa principi Reanimated/Moti equivalenti a:
	•	Fisica Spring: Niente easing lineare. Usa spring premium (stiffness/damping coerenti) per una sensazione premium e pesante.
	•	Transizioni di Layout: Utilizza layout animations per riordini fluidi e ridimensionamenti.
	•	Cicli Infiniti: Ogni card deve avere uno “Stato Attivo” infinito (Pulse, Typewriter, Float o Carousel) per garantire che la dashboard sembri “viva”.
	•	Prestazioni: Qualsiasi moto perpetuo o ciclo infinito DEVE essere memoizzato (React.memo) e isolato. Mai innescare re-render nel layout genitore.

C. I 5 Archetipi di Card (Specifiche Micro-Animation)

Implementa queste micro-animazioni specifiche quando costruisci griglie Bento:
	1.	La Lista Intelligente: Pila verticale con auto-riordino infinito tramite layout animations.
	2.	L’Input di Comando: Barra ricerca/AI con Typewriter + cursore + shimmer di “processing”.
	3.	Lo Stato Live: Indicatori di stato “respiranti” + badge notifica pop-up.
	4.	Il Flusso Dati Ampio: Carousel infinito orizzontale con loop naturale.
	5.	UI Contestuale (Focus Mode): Evidenziazione progressiva + toolbar fluttuante.

10. CONTROLLO PRE-VOLO FINALE

Valuta il tuo codice rispetto a questa matrice prima di produrre l’output. Questo è l’ultimo filtro che applichi alla tua logica.
	•	Lo stato globale è usato appropriatamente per evitare il prop-drilling profondo piuttosto che in modo arbitrario?
	•	Il collasso del layout su schermi piccoli è garantito per i design ad alta varianza?
	•	La stabilità del viewport è gestita con Safe Area + keyboard avoidance (niente assunzioni tipo 100vh)?
	•	Le animazioni e gesture hanno cleanup rigorosi dove applicabile?
	•	Sono forniti gli stati vuoti, di caricamento e di errore?
	•	Le card sono omesse a favore della spaziatura dove possibile?
	•	Hai isolato rigorosamente le animazioni perpetue pesanti per CPU/GPU in componenti foglia memoizzati?