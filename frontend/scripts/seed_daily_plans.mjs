import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const seededPlans = [
  {
    title_it: 'Lecce barocca: marmo e merletti',
    description_it:
      'Una giornata lenta tra facciate scolpite, corti silenziose, botteghe curate e un finale elegante tra calici e luce dorata.',
    cover_image_url:
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1600&auto=format&fit=crop',
    city: 'Lecce',
    season: 'tutto_anno',
    target_audience: 'coppie',
    price: 6.5,
    rating_avg: 4.9,
    rating_count: 32,
    purchases_count: 61,
    slots: [
      {
        slot_order: 1,
        time_label: '09:30',
        type: 'culture',
        activity_title_it: 'Caffè lento tra pietra chiara e prime luci',
        activity_description_it:
          'Inizia in una corte tranquilla del centro, con un caffè leccese e il tempo giusto per guardare i dettagli delle facciate.',
        latitude: 40.3529,
        longitude: 18.1743,
      },
      {
        slot_order: 2,
        time_label: '11:00',
        type: 'culture',
        activity_title_it: 'Passeggiata tra Santa Croce e i palazzi nascosti',
        activity_description_it:
          'Un percorso a piedi tra balconi, rosoni e strade che cambiano atmosfera a ogni angolo.',
        latitude: 40.3537,
        longitude: 18.1727,
      },
      {
        slot_order: 3,
        time_label: '13:15',
        type: 'food',
        activity_title_it: 'Pranzo elegante in una corte riservata',
        activity_description_it:
          'Tavoli ombreggiati, cucina pugliese contemporanea e un ritmo che invita a restare.',
        latitude: 40.3519,
        longitude: 18.1708,
      },
      {
        slot_order: 4,
        time_label: '17:45',
        type: 'shopping',
        activity_title_it: 'Atelier e dettagli da portare via',
        activity_description_it:
          'Ceramiche, carta, tessuti e piccoli oggetti scelti con gusto nel cuore della città vecchia.',
        latitude: 40.3531,
        longitude: 18.1732,
      },
      {
        slot_order: 5,
        time_label: '20:15',
        type: 'nightlife',
        activity_title_it: 'Calici e conversazioni in terrazza',
        activity_description_it:
          'Chiudi la giornata con un aperitivo morbido e la pietra leccese che si accende al tramonto.',
        latitude: 40.3508,
        longitude: 18.1716,
      },
    ],
  },
  {
    title_it: 'Polignano intima: grotte, terrazze e silenzi',
    description_it:
      'Un itinerario disegnato per chi cerca scorci puliti, mare sotto le terrazze e pause belle da ricordare.',
    cover_image_url:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1600&auto=format&fit=crop',
    city: 'Polignano a Mare',
    season: 'estate',
    target_audience: 'coppie',
    price: 7.5,
    rating_avg: 4.8,
    rating_count: 21,
    purchases_count: 44,
    slots: [
      {
        slot_order: 1,
        time_label: '08:45',
        type: 'nature',
        activity_title_it: 'Prima vista sul mare dalle mura alte',
        activity_description_it:
          'Arriva presto per vedere Polignano ancora calma, con il mare quasi immobile sotto di te.',
        latitude: 40.9955,
        longitude: 17.2182,
      },
      {
        slot_order: 2,
        time_label: '10:30',
        type: 'culture',
        activity_title_it: 'Vicoli bianchi e frasi sospese',
        activity_description_it:
          'Cammina senza fretta nel centro storico e lascia che siano i dettagli a guidare la giornata.',
        latitude: 40.9962,
        longitude: 17.2211,
      },
      {
        slot_order: 3,
        time_label: '13:00',
        type: 'food',
        activity_title_it: 'Tavolo vista mare per un pranzo leggero',
        activity_description_it:
          'Una pausa luminosa con crudi, verdure, pane caldo e una vista che fa il resto.',
        latitude: 40.9959,
        longitude: 17.2204,
      },
      {
        slot_order: 4,
        time_label: '18:20',
        type: 'relax',
        activity_title_it: 'Pausa dorata in terrazza',
        activity_description_it:
          'Il momento più bello è quello in cui la luce cambia e la città sembra diventare sospesa.',
        latitude: 40.9964,
        longitude: 17.2217,
      },
      {
        slot_order: 5,
        time_label: '21:00',
        type: 'nightlife',
        activity_title_it: 'Serata morbida tra cocktail e pietra bianca',
        activity_description_it:
          'Un finale raccolto, senza fretta, in un luogo che resta elegante anche quando si riempie.',
        latitude: 40.9961,
        longitude: 17.2198,
      },
    ],
  },
  {
    title_it: 'Bari autentica: forno, quartieri e mare',
    description_it:
      'Una Bari concreta e bellissima, tra profumi di forno, linee del lungomare e tappe che sembrano già di casa.',
    cover_image_url:
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1600&auto=format&fit=crop',
    city: 'Bari',
    season: 'tutto_anno',
    target_audience: 'tutti',
    price: 5.5,
    rating_avg: 4.7,
    rating_count: 18,
    purchases_count: 39,
    slots: [
      {
        slot_order: 1,
        time_label: '09:00',
        type: 'food',
        activity_title_it: 'Forno del mattino tra profumo e strada viva',
        activity_description_it:
          'Inizia con focaccia appena sfornata e il ritmo vero della città che si sveglia.',
        latitude: 41.1281,
        longitude: 16.8685,
      },
      {
        slot_order: 2,
        time_label: '10:45',
        type: 'culture',
        activity_title_it: 'Bari Vecchia senza itinerario rigido',
        activity_description_it:
          'Lascia spazio agli incontri, ai balconi aperti e ai vicoli che cambiano a ogni svolta.',
        latitude: 41.1293,
        longitude: 16.8719,
      },
      {
        slot_order: 3,
        time_label: '13:20',
        type: 'food',
        activity_title_it: 'Pranzo di mare semplice e perfetto',
        activity_description_it:
          'Un posto giusto per crudi, pasta e un servizio senza forzature.',
        latitude: 41.1237,
        longitude: 16.8711,
      },
      {
        slot_order: 4,
        time_label: '17:30',
        type: 'nature',
        activity_title_it: 'Passeggiata sul lungomare al vento giusto',
        activity_description_it:
          'Qui la città si apre, respira e ti accompagna naturalmente verso la sera.',
        latitude: 41.1217,
        longitude: 16.8781,
      },
      {
        slot_order: 5,
        time_label: '20:30',
        type: 'nightlife',
        activity_title_it: 'Aperitivo lungo con vista Adriatico',
        activity_description_it:
          'Chiudi con un tavolo giusto, luce bassa e il rumore del mare a fare da sottofondo.',
        latitude: 41.1189,
        longitude: 16.8832,
      },
    ],
  },
  {
    title_it: 'Ostuni lenta: ulivi, calce e respiro',
    description_it:
      'Un percorso morbido tra bianco assoluto, pause verdi e luoghi da vivere senza accelerare nulla.',
    cover_image_url:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop',
    city: 'Ostuni',
    season: 'primavera',
    target_audience: 'solo',
    price: 6.0,
    rating_avg: 4.9,
    rating_count: 14,
    purchases_count: 28,
    slots: [
      {
        slot_order: 1,
        time_label: '09:15',
        type: 'culture',
        activity_title_it: 'Salita lenta nel bianco della città',
        activity_description_it:
          'Il bello è salire piano, fermarsi spesso e lasciarsi sorprendere dalle prospettive.',
        latitude: 40.7282,
        longitude: 17.5773,
      },
      {
        slot_order: 2,
        time_label: '11:40',
        type: 'shopping',
        activity_title_it: 'Piccole botteghe scelte bene',
        activity_description_it:
          'Ceramiche, lino, carta e oggetti essenziali da cercare con lo sguardo giusto.',
        latitude: 40.7288,
        longitude: 17.5769,
      },
      {
        slot_order: 3,
        time_label: '14:00',
        type: 'food',
        activity_title_it: 'Pranzo in corte ombreggiata',
        activity_description_it:
          'Piatti puliti, materie prime locali e una pausa che riporta il tempo al centro.',
        latitude: 40.7273,
        longitude: 17.5754,
      },
      {
        slot_order: 4,
        time_label: '17:10',
        type: 'relax',
        activity_title_it: 'Giardino appartato tra ulivi e silenzio',
        activity_description_it:
          'Una tappa per staccare davvero, respirare e abbassare il ritmo della giornata.',
        latitude: 40.7268,
        longitude: 17.5791,
      },
      {
        slot_order: 5,
        time_label: '19:50',
        type: 'nature',
        activity_title_it: 'Tramonto sulle colline bianche',
        activity_description_it:
          'Il finale giusto è guardare Ostuni da fuori, quando la luce diventa morbida e larga.',
        latitude: 40.7311,
        longitude: 17.5728,
      },
    ],
  },
  {
    title_it: 'Monopoli blu: porto, vini e sera lenta',
    description_it:
      'Un itinerario tra porto vecchio, tavoli ben scelti e una sera che cresce con misura, senza diventare rumorosa.',
    cover_image_url:
      'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?q=80&w=1600&auto=format&fit=crop',
    city: 'Monopoli',
    season: 'estate',
    target_audience: 'giovani',
    price: 6.9,
    rating_avg: 4.8,
    rating_count: 26,
    purchases_count: 47,
    slots: [
      {
        slot_order: 1,
        time_label: '10:00',
        type: 'culture',
        activity_title_it: 'Porto vecchio e prime geometrie del blu',
        activity_description_it:
          'Una partenza fotografica ma non turistico-stanca: reti, pietra e barche ferme.',
        latitude: 40.9521,
        longitude: 17.3054,
      },
      {
        slot_order: 2,
        time_label: '12:00',
        type: 'culture',
        activity_title_it: 'Passaggi nascosti e scorci sulla città chiara',
        activity_description_it:
          'Segui i passaggi meno ovvi del centro storico e lascia che il porto resti sullo sfondo.',
        latitude: 40.9516,
        longitude: 17.3038,
      },
      {
        slot_order: 3,
        time_label: '13:40',
        type: 'food',
        activity_title_it: 'Pranzo mediterraneo senza formalità',
        activity_description_it:
          'Pesce, verdure, vino bianco e una tavola luminosa abbastanza da fermarti più del previsto.',
        latitude: 40.9507,
        longitude: 17.3029,
      },
      {
        slot_order: 4,
        time_label: '18:45',
        type: 'nightlife',
        activity_title_it: 'Calice vista porto al tramonto',
        activity_description_it:
          'La città cambia ritmo e la serata comincia bene se la apri con la luce giusta.',
        latitude: 40.9519,
        longitude: 17.3061,
      },
      {
        slot_order: 5,
        time_label: '21:15',
        type: 'nightlife',
        activity_title_it: 'Cena lunga e finale sul mare',
        activity_description_it:
          'Un ultimo posto da scegliere per qualità dell’atmosfera più che per rumore o moda.',
        latitude: 40.9528,
        longitude: 17.3072,
      },
    ],
  },
  {
    title_it: 'Trani di sera: pietra chiara e calici',
    description_it:
      'Una Trani sobria e magnetica, costruita attorno alla luce della cattedrale, ai tavoli giusti e a una sera che si allunga bene.',
    cover_image_url:
      'https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1600&auto=format&fit=crop',
    city: 'Trani',
    season: 'tutto_anno',
    target_audience: 'coppie',
    price: 6.8,
    rating_avg: 4.9,
    rating_count: 19,
    purchases_count: 33,
    slots: [
      {
        slot_order: 1,
        time_label: '16:45',
        type: 'culture',
        activity_title_it: 'Ingresso lento tra porto e pietra',
        activity_description_it:
          'Comincia dal porto, con il passo giusto per vedere Trani aprirsi in modo naturale.',
        latitude: 41.2794,
        longitude: 16.418,
      },
      {
        slot_order: 2,
        time_label: '18:00',
        type: 'culture',
        activity_title_it: 'La cattedrale quando la luce cambia',
        activity_description_it:
          'Il momento migliore è quando la facciata smette di essere cartolina e diventa atmosfera.',
        latitude: 41.2806,
        longitude: 16.4171,
      },
      {
        slot_order: 3,
        time_label: '19:30',
        type: 'food',
        activity_title_it: 'Aperitivo elegante senza rumore',
        activity_description_it:
          'Un tavolo ben scelto vicino al mare, con vini bianchi, piccoli piatti e servizio misurato.',
        latitude: 41.2788,
        longitude: 16.4189,
      },
      {
        slot_order: 4,
        time_label: '21:10',
        type: 'nightlife',
        activity_title_it: 'Cena lunga nel bianco della sera',
        activity_description_it:
          'Una tappa da vivere piano, puntando più sull’atmosfera che sulla scena.',
        latitude: 41.2799,
        longitude: 16.4163,
      },
      {
        slot_order: 5,
        time_label: '23:00',
        type: 'nightlife',
        activity_title_it: 'Ultimo calice guardando il porto',
        activity_description_it:
          'Chiudi senza fretta, con il mare davanti e la città ormai morbida.',
        latitude: 41.2782,
        longitude: 16.4195,
      },
    ],
  },
  {
    title_it: 'Gallipoli dorata: sale, spiaggia e tramonto',
    description_it:
      'Una giornata che parte luminosa e finisce morbida, tra acqua chiara, tavoli leggeri e un tramonto da restare in silenzio.',
    cover_image_url:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop',
    city: 'Gallipoli',
    season: 'estate',
    target_audience: 'giovani',
    price: 7.2,
    rating_avg: 4.8,
    rating_count: 24,
    purchases_count: 52,
    slots: [
      {
        slot_order: 1,
        time_label: '10:30',
        type: 'nature',
        activity_title_it: 'Mattina chiara sul litorale',
        activity_description_it:
          'Il momento giusto per il mare è quando tutto è ancora largo, luminoso e poco rumoroso.',
        latitude: 40.0515,
        longitude: 17.9872,
      },
      {
        slot_order: 2,
        time_label: '13:00',
        type: 'food',
        activity_title_it: 'Pranzo salino a due passi dall’acqua',
        activity_description_it:
          'Piatti semplici, pesce fresco e una pausa che non spezza il ritmo estivo della giornata.',
        latitude: 40.0531,
        longitude: 17.9848,
      },
      {
        slot_order: 3,
        time_label: '17:20',
        type: 'culture',
        activity_title_it: 'Centro storico tra pietra e vento',
        activity_description_it:
          'Spostati verso il borgo vecchio per ritrovare ombre, scorci e una Gallipoli più composta.',
        latitude: 40.0553,
        longitude: 17.9819,
      },
      {
        slot_order: 4,
        time_label: '19:40',
        type: 'nightlife',
        activity_title_it: 'Sunset session al lido',
        activity_description_it:
          'La tappa più facile da amare: musica morbida, cocktail giusto e il sole che scende sullo Ionio.',
        latitude: 40.0501,
        longitude: 17.989,
      },
      {
        slot_order: 5,
        time_label: '22:15',
        type: 'nightlife',
        activity_title_it: 'Cena leggera e tavolo in esterno',
        activity_description_it:
          'Un finale estivo da vivere bene, senza accelerare troppo la notte.',
        latitude: 40.0542,
        longitude: 17.9834,
      },
    ],
  },
  {
    title_it: 'Cisternino essenziale: vicoli, carne e quiete',
    description_it:
      'Un percorso semplice e forte, fatto di bianco assoluto, dettagli rurali e soste che sanno di Puglia vera.',
    cover_image_url:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1600&auto=format&fit=crop',
    city: 'Cisternino',
    season: 'autunno',
    target_audience: 'famiglie',
    price: 5.8,
    rating_avg: 4.7,
    rating_count: 13,
    purchases_count: 22,
    slots: [
      {
        slot_order: 1,
        time_label: '09:50',
        type: 'culture',
        activity_title_it: 'Ingresso nel bianco del borgo',
        activity_description_it:
          'Piccole salite, vasi, archi e una luce che qui resta sempre molto morbida.',
        latitude: 40.7428,
        longitude: 17.4285,
      },
      {
        slot_order: 2,
        time_label: '11:30',
        type: 'shopping',
        activity_title_it: 'Botteghe minime e dettagli rurali',
        activity_description_it:
          'Cerca oggetti piccoli, ben fatti, con quell’estetica semplice che qui funziona davvero.',
        latitude: 40.7436,
        longitude: 17.4292,
      },
      {
        slot_order: 3,
        time_label: '13:15',
        type: 'food',
        activity_title_it: 'Pranzo tipico con forno e brace',
        activity_description_it:
          'Il cuore dell’itinerario è qui: sapore locale, nessuna posa e molta sostanza.',
        latitude: 40.7421,
        longitude: 17.4274,
      },
      {
        slot_order: 4,
        time_label: '17:00',
        type: 'nature',
        activity_title_it: 'Sguardo aperto sulla valle',
        activity_description_it:
          'Esci di poco dal centro per prendere aria e guardare il paesaggio allargarsi.',
        latitude: 40.7448,
        longitude: 17.4259,
      },
      {
        slot_order: 5,
        time_label: '19:30',
        type: 'relax',
        activity_title_it: 'Chiusura lenta tra luci basse',
        activity_description_it:
          'Una tappa finale tranquilla, da usare per restare ancora un po’ dentro la giornata.',
        latitude: 40.7432,
        longitude: 17.4281,
      },
    ],
  },
  {
    title_it: 'Martina grafica: portali, forni e linee pulite',
    description_it:
      'Martina Franca raccontata in modo più visivo che turistico, tra architetture nette, soste gustose e una sera composta.',
    cover_image_url:
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1600&auto=format&fit=crop',
    city: 'Martina Franca',
    season: 'tutto_anno',
    target_audience: 'solo',
    price: 5.9,
    rating_avg: 4.8,
    rating_count: 16,
    purchases_count: 27,
    slots: [
      {
        slot_order: 1,
        time_label: '10:00',
        type: 'culture',
        activity_title_it: 'Portali, curve e facciate nette',
        activity_description_it:
          'Segui la parte più grafica della città e lascia che siano le forme a guidarti.',
        latitude: 40.7045,
        longitude: 17.3381,
      },
      {
        slot_order: 2,
        time_label: '11:50',
        type: 'food',
        activity_title_it: 'Forno storico e pausa salata',
        activity_description_it:
          'Una sosta concreta, profumata e molto locale, ideale per dare carattere all’itinerario.',
        latitude: 40.7048,
        longitude: 17.3373,
      },
      {
        slot_order: 3,
        time_label: '15:00',
        type: 'shopping',
        activity_title_it: 'Piccoli indirizzi scelti bene',
        activity_description_it:
          'Tra carta, design e oggetti sobri, qui la ricerca è più interessante del souvenir.',
        latitude: 40.7037,
        longitude: 17.3392,
      },
      {
        slot_order: 4,
        time_label: '18:10',
        type: 'culture',
        activity_title_it: 'Passeggiata centrale in luce bassa',
        activity_description_it:
          'Ricomponi la città con un ultimo giro quando le ombre la rendono più elegante.',
        latitude: 40.7052,
        longitude: 17.3387,
      },
      {
        slot_order: 5,
        time_label: '20:40',
        type: 'food',
        activity_title_it: 'Cena essenziale nel centro storico',
        activity_description_it:
          'Un tavolo raccolto, servizio preciso e il tempo giusto per chiudere bene.',
        latitude: 40.7041,
        longitude: 17.3379,
      },
    ],
  },
  {
    title_it: 'Otranto chiara: mura, vento e acqua',
    description_it:
      'Una Otranto costruita su luce, aperture e pause molto visive, da vivere senza fretta e senza eccessi.',
    cover_image_url:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop',
    city: 'Otranto',
    season: 'estate',
    target_audience: 'tutti',
    price: 7.0,
    rating_avg: 4.9,
    rating_count: 22,
    purchases_count: 41,
    slots: [
      {
        slot_order: 1,
        time_label: '09:20',
        type: 'nature',
        activity_title_it: 'Acqua chiara prima del pieno giorno',
        activity_description_it:
          'Il tratto migliore è vivere Otranto presto, con il mare ancora nitido e poco mosso.',
        latitude: 40.1463,
        longitude: 18.4884,
      },
      {
        slot_order: 2,
        time_label: '11:15',
        type: 'culture',
        activity_title_it: 'Mura, pietra e passaggi aperti',
        activity_description_it:
          'Un giro tra porte, scorci e terrazze che fanno respirare tutta la città.',
        latitude: 40.148,
        longitude: 18.4866,
      },
      {
        slot_order: 3,
        time_label: '13:10',
        type: 'food',
        activity_title_it: 'Pranzo mediterraneo con aria di mare',
        activity_description_it:
          'Una sosta luminosa, perfetta per restare dentro l’energia chiara della giornata.',
        latitude: 40.1471,
        longitude: 18.4879,
      },
      {
        slot_order: 4,
        time_label: '17:30',
        type: 'shopping',
        activity_title_it: 'Piccoli acquisti tra lino e ceramica',
        activity_description_it:
          'Una ricerca leggera, più estetica che commerciale, tra indirizzi scelti bene.',
        latitude: 40.1476,
        longitude: 18.4861,
      },
      {
        slot_order: 5,
        time_label: '20:00',
        type: 'nightlife',
        activity_title_it: 'Aperitivo finale sulle mura',
        activity_description_it:
          'L’ultimo momento giusto è quello in cui il vento sale e la città si mette in posa da sola.',
        latitude: 40.1485,
        longitude: 18.4855,
      },
    ],
  },
];

const planBFallbackByType = {
  culture: {
    title: 'Piano B indoor tra dettagli e atmosfera',
    description:
      'Se il tempo cambia, spostati in uno spazio al chiuso scelto bene: più raccolto, ma coerente con il ritmo della giornata.',
  },
  food: {
    title: 'Piano B gourmand in un interno caldo',
    description:
      'Trasforma la sosta in un momento più lento e protetto, tra tavoli interni, cucina locale e una pausa fatta bene.',
  },
  nightlife: {
    title: 'Piano B serale tra luci basse e calici',
    description:
      'Quando fuori non invita a restare, scegli un posto interno con atmosfera giusta e lascia che la serata cambi tono senza perdere fascino.',
  },
  relax: {
    title: 'Piano B slow tra benessere e quiete',
    description:
      'Ripiega su una tappa intima e silenziosa, pensata per rallentare e proteggere il mood dell’itinerario.',
  },
  shopping: {
    title: 'Piano B tra atelier, carta e piccoli oggetti',
    description:
      'Una deviazione indoor fatta di ricerca estetica, materiali belli e indirizzi raccolti.',
  },
  nature: {
    title: 'Piano B panoramico ma riparato',
    description:
      'Sostituisci l’aperto con un punto coperto o un interno con vista, senza perdere la sensazione di spazio.',
  },
  sport: {
    title: 'Piano B dinamico al coperto',
    description:
      'Mantieni l’energia della tappa con una variante indoor più protetta ma ancora attiva.',
  },
};

function withPlanBSlots(plans) {
  return plans.map((plan) => ({
    ...plan,
    slots: plan.slots.map((slot) => {
      const fallback = planBFallbackByType[slot.type] || planBFallbackByType.culture;
      return {
        ...slot,
        alt_activity_title_it:
          slot.alt_activity_title_it || `${fallback.title} · ${plan.city}`,
        alt_activity_description_it:
          slot.alt_activity_description_it ||
          `${fallback.description} ${slot.activity_title_it} resta il riferimento, ma in versione più raccolta e adatta alla pioggia.`,
      };
    }),
  }));
}

async function getCreatorId() {
  const { data, error } = await supabase
    .from('utenti')
    .select('id, nome, cognome, nickname')
    .limit(1);

  if (error) throw error;
  if (!data?.length) {
    throw new Error('No users found in utenti. Create at least one account first.');
  }

  return data[0].id;
}

async function clearExistingPlans(titles) {
  const { data, error } = await supabase
    .from('daily_plans')
    .select('id, title_it')
    .in('title_it', titles);

  if (error) throw error;
  if (!data?.length) return 0;

  const ids = data.map((plan) => plan.id);
  const { error: deleteError } = await supabase
    .from('daily_plans')
    .delete()
    .in('id', ids);

  if (deleteError) throw deleteError;
  return ids.length;
}

async function seed() {
  const creatorId = await getCreatorId();
  const plansToInsert = withPlanBSlots(seededPlans);
  const removedCount = await clearExistingPlans(plansToInsert.map((plan) => plan.title_it));

  const insertedPlans = [];

  for (const plan of plansToInsert) {
    const { slots, ...planPayload } = plan;

    const { data: createdPlan, error: planError } = await supabase
      .from('daily_plans')
      .insert({
        ...planPayload,
        creator_id: creatorId,
        is_published: true,
      })
      .select('id, title_it')
      .single();

    if (planError) throw planError;

    const { error: slotsError } = await supabase
      .from('plan_slots')
      .insert(
        slots.map((slot) => ({
          ...slot,
          plan_id: createdPlan.id,
        })),
      );

    if (slotsError) throw slotsError;
    insertedPlans.push(createdPlan);
  }

  console.log(
    JSON.stringify(
      {
        removedCount,
        insertedCount: insertedPlans.length,
        titles: insertedPlans.map((plan) => plan.title_it),
      },
      null,
      2,
    ),
  );
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
