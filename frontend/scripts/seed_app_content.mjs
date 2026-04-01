import { createClient } from '@supabase/supabase-js';

const url = 'https://sauptieqzeipyynorfmf.supabase.co';
const serviceRole =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdXB0aWVxemVpcHl5bm9yZm1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwMjcyMywiZXhwIjoyMDkwNTc4NzIzfQ.4i1M1MIdWS46EXb_tGlYE6nillORlmkZdfyMDGE2lmo';

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const partnerSeeds = [
  {
    slug: 'osteria-del-faro-bari',
    name: 'Osteria del Faro',
    category: 'Ristorante',
    subcategory: 'Osteria',
    description: 'Cucina pugliese contemporanea a due passi dal lungomare, con crudi, focacce e carta vini locale.',
    city: 'Bari',
    address: 'Lungomare Nazario Sauro 14, Bari',
    latitude: 41.1237,
    longitude: 16.8711,
    logo_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/osteria-del-faro',
    instagram_url: 'https://instagram.com/osteriadelfaro',
    is_verified: true,
    atmosphere: ['Autentico', 'Gastronomico', 'Panoramico'],
    ideal_moment: ['pranzo', 'cena'],
    ideal_target: ['coppia', 'amici', 'solo_traveler'],
    price_range: 'medium',
    profile_score: 92,
  },
  {
    slug: 'corte-bianca-polignano',
    name: 'Corte Bianca',
    category: 'Ospitalita',
    subcategory: 'Boutique hotel',
    description: 'Dimora in pietra chiara nel centro di Polignano, con terrazza e colazioni lente.',
    city: 'Polignano a Mare',
    address: 'Via San Benedetto 8, Polignano a Mare',
    latitude: 40.9964,
    longitude: 17.2217,
    logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/corte-bianca',
    instagram_url: 'https://instagram.com/cortebianca',
    is_verified: true,
    atmosphere: ['Romantico', 'Elegante', 'Slow & rilassante'],
    ideal_moment: ['weekend', 'giornata_intera'],
    ideal_target: ['coppia', 'solo_traveler'],
    price_range: 'premium',
    profile_score: 95,
  },
  {
    slug: 'cantina-levante-monopoli',
    name: 'Cantina Levante',
    category: 'Food & Specialita',
    subcategory: 'Cantina',
    description: 'Degustazioni guidate, vini salini e racconti di vigneti affacciati sull’Adriatico.',
    city: 'Monopoli',
    address: 'Contrada Santa Teresa 3, Monopoli',
    latitude: 40.9507,
    longitude: 17.3029,
    logo_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/cantina-levante',
    instagram_url: 'https://instagram.com/cantinalevante',
    is_verified: true,
    atmosphere: ['Autentico', 'Esclusivo', 'Panoramico'],
    ideal_moment: ['aperitivo', 'tramonto', 'weekend'],
    ideal_target: ['coppia', 'amici', 'gruppi'],
    price_range: 'premium',
    profile_score: 90,
  },
  {
    slug: 'atelier-barocco-lecce',
    name: 'Atelier Barocco',
    category: 'Shopping & Artigianato',
    subcategory: 'Ceramica artistica',
    description: 'Bottega curata nel cuore di Lecce tra ceramiche, carte pregiate e piccoli oggetti da collezione.',
    city: 'Lecce',
    address: 'Via Palmieri 21, Lecce',
    latitude: 40.3531,
    longitude: 18.1732,
    logo_url: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/atelier-barocco',
    instagram_url: 'https://instagram.com/atelierbarocco',
    is_verified: false,
    atmosphere: ['Tradizionale', 'Curata', 'Instagrammabile'],
    ideal_moment: ['mattina', 'pomeriggio'],
    ideal_target: ['coppia', 'amici', 'famiglia'],
    price_range: 'medium',
    profile_score: 84,
  },
  {
    slug: 'giardino-segreto-ostuni',
    name: 'Giardino Segreto',
    category: 'Benessere & Relax',
    subcategory: 'Day use relax',
    description: 'Corte bianca tra ulivi, tisane, massaggi e una piscina silenziosa tra muri a calce.',
    city: 'Ostuni',
    address: 'Contrada San Giovanni, Ostuni',
    latitude: 40.7288,
    longitude: 17.5769,
    logo_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/giardino-segreto',
    instagram_url: 'https://instagram.com/giardinosegreto',
    is_verified: true,
    atmosphere: ['Slow & rilassante', 'Esclusivo', 'Panoramico'],
    ideal_moment: ['giornata_intera', 'weekend'],
    ideal_target: ['coppia', 'solo_traveler'],
    price_range: 'luxury',
    profile_score: 93,
  },
  {
    slug: 'notte-bianca-trani',
    name: 'Notte Bianca',
    category: 'Nightlife & Social',
    subcategory: 'Wine bar',
    description: 'Calici, musica morbida e tavolini in pietra a pochi passi dalla cattedrale sul mare.',
    city: 'Trani',
    address: 'Via Ognissanti 5, Trani',
    latitude: 41.2794,
    longitude: 16.418,
    logo_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/notte-bianca',
    instagram_url: 'https://instagram.com/nottebiancatrani',
    is_verified: false,
    atmosphere: ['Vivace', 'Romantico', 'Curata'],
    ideal_moment: ['aperitivo', 'dopocena'],
    ideal_target: ['coppia', 'amici'],
    price_range: 'medium',
    profile_score: 82,
  },
  {
    slug: 'masseria-delle-vigne-cisternino',
    name: 'Masseria delle Vigne',
    category: 'Ospitalita',
    subcategory: 'Masseria',
    description: 'Camere bianche, colazioni tra gli ulivi e una corte rurale che invita a rallentare.',
    city: 'Cisternino',
    address: 'Contrada Pico 7, Cisternino',
    latitude: 40.7428,
    longitude: 17.4285,
    logo_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/masseria-delle-vigne',
    instagram_url: 'https://instagram.com/masseriadellevigne',
    is_verified: true,
    atmosphere: ['Autentico', 'Slow & rilassante', 'Panoramico'],
    ideal_moment: ['weekend', 'giornata_intera'],
    ideal_target: ['coppia', 'famiglia'],
    price_range: 'premium',
    profile_score: 91,
  },
  {
    slug: 'forno-antico-martina-franca',
    name: 'Forno Antico',
    category: 'Food & Specialita',
    subcategory: 'Forno tipico',
    description: 'Pane, focacce e biscotti lenti nel centro di Martina Franca, con profumi che escono sulla strada.',
    city: 'Martina Franca',
    address: 'Via Cavour 18, Martina Franca',
    latitude: 40.7045,
    longitude: 17.3381,
    logo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/forno-antico',
    instagram_url: 'https://instagram.com/fornoanticomf',
    is_verified: false,
    atmosphere: ['Tradizionale', 'Autentico', 'Informale'],
    ideal_moment: ['colazione', 'pranzo'],
    ideal_target: ['famiglia', 'amici', 'solo_traveler'],
    price_range: 'low',
    profile_score: 80,
  },
  {
    slug: 'lido-aurora-gallipoli',
    name: 'Lido Aurora',
    category: 'Nightlife & Social',
    subcategory: 'Beach bar',
    description: 'Spiaggia chiara, cocktail al tramonto e una selezione musicale morbida fino a sera.',
    city: 'Gallipoli',
    address: 'Lungomare Galileo Galilei 60, Gallipoli',
    latitude: 40.0515,
    longitude: 17.9872,
    logo_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/lido-aurora',
    instagram_url: 'https://instagram.com/lidoaurora',
    is_verified: true,
    atmosphere: ['Vivace', 'Panoramico', 'Curata'],
    ideal_moment: ['aperitivo', 'dopocena', 'weekend'],
    ideal_target: ['coppia', 'amici', 'gruppi'],
    price_range: 'medium',
    profile_score: 88,
  },
  {
    slug: 'biblioteca-del-porto-monopoli',
    name: 'Biblioteca del Porto',
    category: 'Cultura & Intrattenimento',
    subcategory: 'Galleria / atelier',
    description: 'Uno spazio ibrido tra libri, piccole mostre, design e laboratori affacciati sul porto.',
    city: 'Monopoli',
    address: 'Via Porto 11, Monopoli',
    latitude: 40.9521,
    longitude: 17.3054,
    logo_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/biblioteca-del-porto',
    instagram_url: 'https://instagram.com/bibliotecadelporto',
    is_verified: false,
    atmosphere: ['Curata', 'Moderno', 'Slow & rilassante'],
    ideal_moment: ['mattina', 'pomeriggio'],
    ideal_target: ['solo_traveler', 'coppia', 'amici'],
    price_range: 'medium',
    profile_score: 83,
  },
  {
    slug: 'terrazza-adriatica-trani',
    name: 'Terrazza Adriatica',
    category: 'Ristorante',
    subcategory: 'Ristorante vista mare',
    description: 'Tavoli sul porto, pescato del giorno e una cucina elegante ma leggibile.',
    city: 'Trani',
    address: 'Piazza Quercia 4, Trani',
    latitude: 41.2776,
    longitude: 16.4171,
    logo_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/terrazza-adriatica',
    instagram_url: 'https://instagram.com/terrazzaadriatica',
    is_verified: true,
    atmosphere: ['Elegante', 'Panoramico', 'Romantico'],
    ideal_moment: ['pranzo', 'cena'],
    ideal_target: ['coppia', 'amici'],
    price_range: 'premium',
    profile_score: 89,
  },
  {
    slug: 'orto-lento-ostuni',
    name: 'Orto Lento',
    category: 'Ristorazione',
    subcategory: 'Vegetariano / Vegano',
    description: 'Piatti vegetali, orto stagionale e tavoli essenziali in una corte bianca di Ostuni.',
    city: 'Ostuni',
    address: 'Via Bixio Continelli 12, Ostuni',
    latitude: 40.7312,
    longitude: 17.5763,
    logo_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop',
    cover_image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1200&auto=format&fit=crop',
    website_url: 'https://example.com/orto-lento',
    instagram_url: 'https://instagram.com/ortolento',
    is_verified: false,
    atmosphere: ['Slow & rilassante', 'Curata', 'Autentico'],
    ideal_moment: ['pranzo', 'cena'],
    ideal_target: ['coppia', 'solo_traveler', 'amici'],
    price_range: 'medium',
    profile_score: 86,
  },
];

const cardSeeds = [
  {
    title: 'Basilica di San Nicola',
    city: 'Bari',
    gps_lat: 41.1317,
    gps_lng: 16.8687,
    image_url: 'https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?q=80&w=1200&auto=format&fit=crop',
    description: 'Il cuore spirituale della Bari vecchia, tra pietra chiara e pellegrini.',
  },
  {
    title: 'Teatro Margherita',
    city: 'Bari',
    gps_lat: 41.1255,
    gps_lng: 16.8719,
    image_url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1200&auto=format&fit=crop',
    description: 'L’ex palafitta sul mare diventata spazio culturale sospeso tra acqua e città.',
  },
  {
    title: 'Muraglia di Bari',
    city: 'Bari',
    gps_lat: 41.1325,
    gps_lng: 16.8703,
    image_url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=1200&auto=format&fit=crop',
    description: 'Il bordo della città vecchia, dove il vento e l’Adriatico cambiano il passo.',
  },
  {
    title: 'Balcone su Lama Monachile',
    city: 'Polignano a Mare',
    gps_lat: 40.9958,
    gps_lng: 17.218,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    description: 'Uno sguardo che cade a picco sul blu, tra roccia, luce e mare.',
  },
  {
    title: 'Arco Marchesale',
    city: 'Polignano a Mare',
    gps_lat: 40.9951,
    gps_lng: 17.2203,
    image_url: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=1200&auto=format&fit=crop',
    description: 'La porta d’ingresso al centro storico, stretta e scenografica.',
  },
  {
    title: 'Scalinata delle Poesie',
    city: 'Polignano a Mare',
    gps_lat: 40.9956,
    gps_lng: 17.2196,
    image_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200&auto=format&fit=crop',
    description: 'Parole incise tra gradini bianchi e scorci che sembrano cartoline.',
  },
  {
    title: 'Piazza Duomo di Lecce',
    city: 'Lecce',
    gps_lat: 40.3514,
    gps_lng: 18.1698,
    image_url: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=1200&auto=format&fit=crop',
    description: 'Una piazza-teatro barocca che si apre all’improvviso, luminosa e scenica.',
  },
  {
    title: 'Anfiteatro Romano',
    city: 'Lecce',
    gps_lat: 40.3524,
    gps_lng: 18.1736,
    image_url: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?q=80&w=1200&auto=format&fit=crop',
    description: 'Le stratificazioni di Lecce emergono nella pietra, nel centro della città.',
  },
  {
    title: 'Basilica di Santa Croce',
    city: 'Lecce',
    gps_lat: 40.3542,
    gps_lng: 18.1721,
    image_url: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop',
    description: 'Il barocco leccese al suo massimo, pieno di dettagli da scoprire lentamente.',
  },
  {
    title: 'Porto Antico di Monopoli',
    city: 'Monopoli',
    gps_lat: 40.9523,
    gps_lng: 17.3049,
    image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    description: 'Barche azzurre, pietra chiara e un ritmo che sa ancora di porto vivo.',
  },
  {
    title: 'Castello Carlo V',
    city: 'Monopoli',
    gps_lat: 40.9516,
    gps_lng: 17.3057,
    image_url: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop',
    description: 'Una fortezza sul bordo del mare che misura il tempo di Monopoli.',
  },
  {
    title: 'Cala Porta Vecchia',
    city: 'Monopoli',
    gps_lat: 40.9501,
    gps_lng: 17.3042,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    description: 'Una piccola baia cittadina, dove l’acqua incontra i bastioni.',
  },
  {
    title: 'Cattedrale sul Porto',
    city: 'Trani',
    gps_lat: 41.2797,
    gps_lng: 16.4174,
    image_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200&auto=format&fit=crop',
    description: 'La facciata chiara di Trani si alza direttamente dal mare come una vela di pietra.',
  },
  {
    title: 'Molo di Tramontana',
    city: 'Trani',
    gps_lat: 41.2811,
    gps_lng: 16.4179,
    image_url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=1200&auto=format&fit=crop',
    description: 'Una linea d’aria e acqua, perfetta per capire il porto e la sua luce.',
  },
  {
    title: 'Piazza della Repubblica',
    city: 'Trani',
    gps_lat: 41.2772,
    gps_lng: 16.4161,
    image_url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1200&auto=format&fit=crop',
    description: 'La soglia urbana da cui Trani passa dal porto alla sua trama più lenta.',
  },
  {
    title: 'Spiaggia della Purità',
    city: 'Gallipoli',
    gps_lat: 40.0546,
    gps_lng: 17.9789,
    image_url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop',
    description: 'Una spiaggia nel centro storico, quasi irreale nelle ore chiare.',
  },
  {
    title: 'Bastioni di Gallipoli',
    city: 'Gallipoli',
    gps_lat: 40.0537,
    gps_lng: 17.9801,
    image_url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=1200&auto=format&fit=crop',
    description: 'Il giro delle mura regala vento, mare e un continuo cambio di prospettiva.',
  },
  {
    title: 'Mercato del Pesce',
    city: 'Gallipoli',
    gps_lat: 40.0531,
    gps_lng: 17.9811,
    image_url: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?q=80&w=1200&auto=format&fit=crop',
    description: 'La parte più viva e sonora di Gallipoli, tra casse, ghiaccio e pescatori.',
  },
  {
    title: 'Piazza della Libertà',
    city: 'Ostuni',
    gps_lat: 40.732,
    gps_lng: 17.5771,
    image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop',
    description: 'Il bianco di Ostuni si raccoglie in una piazza verticale piena di salite.',
  },
  {
    title: 'Arco Scoppa',
    city: 'Ostuni',
    gps_lat: 40.7327,
    gps_lng: 17.5775,
    image_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1200&auto=format&fit=crop',
    description: 'Un passaggio sospeso tra gli edifici che sembra tenere insieme il centro storico.',
  },
  {
    title: 'Belvedere sulle Mura',
    city: 'Ostuni',
    gps_lat: 40.7313,
    gps_lng: 17.5754,
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    description: 'Da qui Ostuni si apre verso la piana degli ulivi e il mare lontano.',
  },
];

const sagaSeeds = [
  {
    title_it: 'Bari di Pietra e Mare',
    title_en: 'Bari of Stone and Sea',
    title: 'Bari di Pietra e Mare',
    description_it: 'Una camminata tra spiritualità, architettura e vento salmastro nel cuore di Bari.',
    description_en: 'A walk through spirituality, architecture and sea breeze in the heart of Bari.',
    image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1400&auto=format&fit=crop',
    city: 'Bari',
    quest_type: 'Storico',
    starting_point: 'Basilica di San Nicola',
    lore_text_it: 'Comincia dove arrivano i pellegrini e finisce dove la città si affaccia sul mare: una saga lenta, urbana e piena di dettagli.',
    lore_text_en: 'Start where pilgrims arrive and end where the city opens to the sea: a slow urban saga full of details.',
    estimated_time_min: 95,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Ritrova il punto da cui Bari racconta la sua devozione più antica.',
      'Segui la linea dell’acqua fino al luogo sospeso tra città e mare.',
      'Chiudi la saga dove il bordo della città incontra il vento dell’Adriatico.',
    ],
  },
  {
    title_it: 'Polignano Verticale',
    title_en: 'Vertical Polignano',
    title: 'Polignano Verticale',
    description_it: 'Tre tappe per leggere Polignano dall’alto, tra archi, versi e balconi sul blu.',
    description_en: 'Three stops to read Polignano from above, among arches, verses and blue horizons.',
    image_url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1400&auto=format&fit=crop',
    city: 'Polignano a Mare',
    quest_type: 'Panoramico',
    starting_point: 'Balcone su Lama Monachile',
    lore_text_it: 'Questa saga chiede occhi curiosi e passo leggero: ogni tappa è una soglia, ogni soglia un affaccio.',
    lore_text_en: 'This saga asks for curious eyes and a light step: every stop is a threshold, every threshold an overlook.',
    estimated_time_min: 80,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Inizia dal panorama più celebre, ma guardalo come se fosse la prima volta.',
      'Attraversa la soglia che apre il centro storico come un piccolo rito.',
      'Concludi la saga lì dove i gradini diventano parole e il mare resta sul fondo.',
    ],
  },
  {
    title_it: 'Lecce, Oro e Barocco',
    title_en: 'Lecce, Gold and Baroque',
    title: 'Lecce, Oro e Barocco',
    description_it: 'Una saga dorata tra piazze scenografiche, rovine romane e pietra scolpita.',
    description_en: 'A golden saga through theatrical squares, Roman ruins and carved stone.',
    image_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1400&auto=format&fit=crop',
    city: 'Lecce',
    quest_type: 'Culturale',
    starting_point: 'Piazza Duomo',
    lore_text_it: 'A Lecce la pietra non è mai ferma: riflette il sole, si accende al tramonto e racconta secoli di stratificazioni.',
    lore_text_en: 'In Lecce, stone is never still: it reflects the sun, glows at sunset and tells centuries of layers.',
    estimated_time_min: 100,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Lasciati sorprendere dalla piazza che appare all’improvviso, quasi come un sipario che si apre.',
      'Scendi nel tempo e ascolta la città romana che ancora emerge tra i passi contemporanei.',
      'Finisci davanti alla facciata che più di tutte incarna il gusto teatrale di Lecce.',
    ],
  },
  {
    title_it: 'Monopoli tra Porto e Bastioni',
    title_en: 'Monopoli Between Harbor and Bastions',
    title: 'Monopoli tra Porto e Bastioni',
    description_it: 'Una saga marina e chiara, tra porto antico, fortezze e piccole cale cittadine.',
    description_en: 'A bright maritime saga through the old harbor, fortifications and small urban coves.',
    image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop',
    city: 'Monopoli',
    quest_type: 'Marittimo',
    starting_point: 'Porto Antico di Monopoli',
    lore_text_it: 'Monopoli non si legge tutta insieme: si entra dal porto, si sfiora la pietra militare, si chiude con il rumore dell’acqua vicina.',
    lore_text_en: 'Monopoli is not read all at once: you enter from the harbor, brush past military stone, and end with the sound of nearby water.',
    estimated_time_min: 90,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Inizia dal porto, dove le barche colorano ancora il primo racconto della città.',
      'Raggiungi la fortezza sul bordo dell’acqua e osserva come Monopoli si difendeva dal mare.',
      'Concludi in una cala urbana, dove la città rallenta e lascia spazio alla luce.',
    ],
  },
  {
    title_it: 'Trani di Pietra e Riflessi',
    title_en: 'Trani of Stone and Reflections',
    title: 'Trani di Pietra e Riflessi',
    description_it: 'Una saga breve e luminosa tra cattedrale, molo e piazze che si specchiano nel porto.',
    description_en: 'A short luminous saga through cathedral, pier and squares mirrored in the harbor.',
    image_url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=1400&auto=format&fit=crop',
    city: 'Trani',
    quest_type: 'Panoramico',
    starting_point: 'Cattedrale sul Porto',
    lore_text_it: 'A Trani la pietra sembra galleggiare: questa saga ti porta dove la città diventa riflesso, percorso e silenzio.',
    lore_text_en: 'In Trani the stone seems to float: this saga leads you where the city becomes reflection, route and silence.',
    estimated_time_min: 75,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Parti dalla cattedrale sul mare e guarda come la città si mette in scena da sola.',
      'Percorri il molo e lascia che il porto cambi la tua prospettiva passo dopo passo.',
      'Chiudi la saga nella piazza dove Trani torna urbana e raccolta.',
    ],
  },
  {
    title_it: 'Gallipoli tra Sale e Mura',
    title_en: 'Gallipoli Between Salt and Walls',
    title: 'Gallipoli tra Sale e Mura',
    description_it: 'Una saga salentina dal passo salmastro, tra spiaggia urbana, bastioni e mercato.',
    description_en: 'A Salento saga with a salty rhythm, between urban beach, bastions and market.',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop',
    city: 'Gallipoli',
    quest_type: 'Autentico',
    starting_point: 'Spiaggia della Purità',
    lore_text_it: 'Gallipoli ha un centro che sa di mare in ogni angolo: acqua, pietra, pesce e vento costruiscono qui un racconto immediato.',
    lore_text_en: 'Gallipoli has a center that tastes of the sea in every corner: water, stone, fish and wind build an immediate story here.',
    estimated_time_min: 85,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Comincia dalla spiaggia più sorprendente, incastonata nel cuore della città vecchia.',
      'Cammina sui bastioni per leggere Gallipoli dal suo bordo più forte.',
      'Finisci al mercato del pesce, dove la saga torna viva, concreta e quotidiana.',
    ],
  },
  {
    title_it: 'Ostuni in Ascesa',
    title_en: 'Ostuni Rising',
    title: 'Ostuni in Ascesa',
    description_it: 'Salite bianche, archi sospesi e un finale aperto sulla piana degli ulivi.',
    description_en: 'White climbs, suspended arches and a final opening over the plain of olive trees.',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400&auto=format&fit=crop',
    city: 'Ostuni',
    quest_type: 'Panoramico',
    starting_point: 'Piazza della Libertà',
    lore_text_it: 'Ostuni si conquista lentamente, passo dopo passo. Questa saga segue il suo movimento naturale: salire, attraversare, aprirsi.',
    lore_text_en: 'Ostuni is conquered slowly, step by step. This saga follows its natural movement: climb, cross, open.',
    estimated_time_min: 90,
    estimated_steps: 3,
    is_active: true,
    is_original: true,
    steps: [
      'Apri la saga nella piazza che dà respiro al bianco di Ostuni.',
      'Attraversa l’arco che unisce i volumi della città come un ponte sospeso.',
      'Concludi sul belvedere dove la città lascia spazio alla piana degli ulivi.',
    ],
  },
];

const newsSeeds = [
  {
    title: 'Nuove saghe editoriali tra Bari, Lecce e Polignano',
    excerpt: 'Tre percorsi lenti e immersivi per scoprire la Puglia con un ritmo più narrativo.',
    category: 'Novita',
    image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop',
    published_at: new Date().toISOString(),
  },
  {
    title: 'Weekend in Puglia: partner selezionati per mangiare, dormire e rallentare',
    excerpt: 'Una piccola selezione di luoghi curati per iniziare a usare l’app con contenuti reali.',
    category: 'Selezione',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop',
    published_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    title: 'Lecce barocca, Bari marinara, Polignano verticale',
    excerpt: 'Tre immaginari diversi per orientarsi nelle prime esperienze Desideri di Puglia.',
    category: 'Editoriale',
    image_url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1200&auto=format&fit=crop',
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    title: 'Partner autenticati: dove cominciare adesso',
    excerpt: 'Ristorazione, relax, artigianato e wine bar già pronti da esplorare nel Club.',
    category: 'Partner',
    image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1200&auto=format&fit=crop',
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    title: 'Monopoli e Trani entrano nella selezione iniziale',
    excerpt: 'Nuovi partner e nuove saghe per dare più profondità alle prime esplorazioni dentro il Club.',
    category: 'Novita',
    image_url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=80&w=1200&auto=format&fit=crop',
    published_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    title: 'Gallipoli e Ostuni: due ritmi opposti, stessa Puglia',
    excerpt: 'Una più salmastra e urbana, l’altra luminosa e verticale: due nuove saghe per orientarsi meglio.',
    category: 'Editoriale',
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

async function cleanupSmokeData() {
  const { data: smokePartners } = await supabase
    .from('partners')
    .select('id, owner_user_id, slug, name')
    .or('name.eq.Smoke Partner,slug.ilike.codex-%');

  const smokePartnerIds = (smokePartners || []).map((row) => row.id);
  const smokeOwnerIds = [...new Set((smokePartners || []).map((row) => row.owner_user_id).filter(Boolean))];

  if (smokePartnerIds.length) {
    await supabase.from('partner_events_created').delete().in('partner_id', smokePartnerIds);
    await supabase.from('partner_opening_hours').delete().in('partner_id', smokePartnerIds);
    await supabase.from('partners').delete().in('id', smokePartnerIds);
  }

  const { data: userPage } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  const smokeUsers = (userPage?.users || []).filter((user) =>
    /^codex-(smoke|partner)-/i.test(user.email || '')
  );

  const smokeUserIds = [...new Set([...smokeOwnerIds, ...smokeUsers.map((user) => user.id)])];

  if (smokeUserIds.length) {
    await supabase.from('utenti').delete().in('id', smokeUserIds);
  }

  for (const user of smokeUsers) {
    await supabase.auth.admin.deleteUser(user.id).catch(() => {});
  }
}

async function ensureNewsTable() {
  const sql = `
    create table if not exists public.news_items (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      excerpt text,
      image_url text,
      category text not null default 'Novita',
      published_at timestamptz not null default now(),
      is_published boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    alter table public.news_items enable row level security;
    drop policy if exists news_items_public_read on public.news_items;
    create policy news_items_public_read on public.news_items
    for select using (is_published = true);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error && !String(error.message || '').includes('Could not find')) {
    console.warn('news_items bootstrap warning:', error.message);
  }
}

async function upsertPartners() {
  const inserted = [];

  for (const seed of partnerSeeds) {
    const existing = await supabase
      .from('partners')
      .select('id, slug')
      .eq('slug', seed.slug)
      .maybeSingle();

    if (existing.data?.id) {
      await supabase
        .from('partners')
        .update({
          ...seed,
          is_active: true,
          subscription_status: 'active',
        })
        .eq('id', existing.data.id);
      inserted.push({ id: existing.data.id, ...seed });
      continue;
    }

    const { data, error } = await supabase
      .from('partners')
      .insert([
        {
          ...seed,
          is_active: true,
          subscription_status: 'active',
          commission_rate: 15,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    inserted.push({ id: data.id, ...seed });
  }

  return inserted;
}

async function upsertCards() {
  const inserted = [];

  for (const seed of cardSeeds) {
    const existing = await supabase
      .from('cards')
      .select('id')
      .eq('title', seed.title)
      .maybeSingle();

    if (existing.data?.id) {
      await supabase
        .from('cards')
        .update({
          ...seed,
          type: 'monument',
          rarity: 'rare',
          gps_radius: 120,
          points_value: 120,
        })
        .eq('id', existing.data.id);
      inserted.push({ id: existing.data.id, ...seed });
      continue;
    }

    const { data, error } = await supabase
      .from('cards')
      .insert([
        {
          ...seed,
          type: 'monument',
          rarity: 'rare',
          gps_radius: 120,
          points_value: 120,
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    inserted.push({ id: data.id, ...seed });
  }

  return inserted;
}

async function upsertSaghe(cards) {
  const cardByCity = cards.reduce((acc, card) => {
    acc[card.city] ||= [];
    acc[card.city].push(card);
    return acc;
  }, {});

  const inserted = [];

  for (const saga of sagaSeeds) {
    let setId;
    const existing = await supabase
      .from('quest_sets')
      .select('id')
      .eq('title_it', saga.title_it)
      .maybeSingle();

    const payload = {
      title: saga.title,
      title_it: saga.title_it,
      title_en: saga.title_en,
      description_it: saga.description_it,
      description_en: saga.description_en,
      image_url: saga.image_url,
      city: saga.city,
      quest_type: saga.quest_type,
      starting_point: saga.starting_point,
      lore_text_it: saga.lore_text_it,
      lore_text_en: saga.lore_text_en,
      estimated_time_min: saga.estimated_time_min,
      estimated_steps: saga.estimated_steps,
      is_active: true,
      is_original: true,
    };

    if (existing.data?.id) {
      setId = existing.data.id;
      const { error } = await supabase.from('quest_sets').update(payload).eq('id', setId);
      if (error) throw error;
      await supabase.from('quest_set_steps').delete().eq('quest_set_id', setId);
    } else {
      const { data, error } = await supabase.from('quest_sets').insert([payload]).select('id').single();
      if (error) throw error;
      setId = data.id;
    }

    const cityCards = cardByCity[saga.city] || [];
    const stepRows = saga.steps.map((description, index) => ({
      quest_set_id: setId,
      step_order: index + 1,
      title: `Tappa ${index + 1}`,
      description,
      reference_table: 'cards',
      reference_id: cityCards[index]?.id || null,
    }));

    const { error: stepError } = await supabase.from('quest_set_steps').insert(stepRows);
    if (stepError) throw stepError;

    inserted.push({ id: setId, title_it: saga.title_it });
  }

  return inserted;
}

async function upsertNews() {
  const inserted = [];

  for (const item of newsSeeds) {
    const existing = await supabase
      .from('news_items')
      .select('id')
      .eq('title', item.title)
      .maybeSingle();

    if (existing.data?.id) {
      await supabase
        .from('news_items')
        .update({ ...item, is_published: true })
        .eq('id', existing.data.id);
      inserted.push({ id: existing.data.id, ...item });
      continue;
    }

    const { data, error } = await supabase
      .from('news_items')
      .insert([{ ...item, is_published: true }])
      .select('id')
      .single();

    if (error) throw error;
    inserted.push({ id: data.id, ...item });
  }

  return inserted;
}

async function main() {
  await cleanupSmokeData();
  await ensureNewsTable().catch(() => {});

  const partners = await upsertPartners();
  const cards = await upsertCards();
  const saghe = await upsertSaghe(cards);
  const news = await upsertNews();

  console.log(
    JSON.stringify(
      {
        partners: partners.map((p) => ({ id: p.id, name: p.name, city: p.city })),
        cards: cards.map((c) => ({ id: c.id, title: c.title, city: c.city })),
        saghe,
        news: news.map((n) => ({ id: n.id, title: n.title })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
