/**
 * nowMatching.js
 * Logica di ranking per la feature "Cosa faccio adesso?"
 *
 * PESI:
 *   intent match      → 35 pt  (bisogno primario, peso massimo)
 *   atmosphere match  → 25 pt  (mood, peso alto)
 *   companion match   → 15 pt  (compagnia, peso medio)
 *   time match        → 10 pt  (durata, peso medio)
 *   profile_score     → 10 pt  (qualità profilo, bonus)
 *   plan tier bonus   →  5 pt  (piano partner, non dominante)
 *   TOTALE MAX        → 100 pt
 */

// Mappa intent → categorie partner + momenti ideali
const INTENT_MAP = {
  mangiare: {
    categories: ['ristorante', 'osteria', 'trattoria', 'pizzeria', 'cibo', 'food', 'ristorazione', 'cucina'],
    moments: ['pranzo', 'cena', 'aperitivo', 'colazione'],
  },
  vedere: {
    categories: ['museo', 'arte', 'cultura', 'monumento', 'panorama', 'galleria', 'storia'],
    moments: ['mattina', 'pomeriggio', 'tutto il giorno'],
  },
  tappa: {
    categories: ['artigianato', 'masseria', 'borgo', 'prodotti locali', 'local', 'tipico', 'bottega', 'cantina', 'caseificio'],
    moments: ['mattina', 'pomeriggio', 'tutto il giorno'],
  },
  relax: {
    categories: ['spa', 'beach', 'lido', 'natura', 'resort', 'wellness', 'relax', 'agriturismo'],
    moments: ['pomeriggio', 'mattina', 'tutto il giorno'],
  },
  serata: {
    categories: ['bar', 'enoteca', 'cocktail', 'live', 'musica', 'club', 'lounge', 'disco', 'wine bar'],
    moments: ['sera', 'notte', 'aperitivo'],
  },
};

// Mappa companion → target partner
const COMPANION_MAP = {
  solo: ['solo', 'giovani', 'single', 'digital nomad', 'viaggiatore'],
  coppia: ['coppia', 'romantico', 'adulti', 'due'],
  amici: ['gruppo', 'giovani', 'amici', 'comitiva'],
  famiglia: ['famiglia', 'bambini', 'kids', 'family'],
};

// Mappa time → durate experience
const TIME_MAP = {
  short: ['30 min', '45 min', '30-45 min', 'breve', 'veloce', '< 1h'],
  medium: ['1h', '2h', '1-2h', '1 ora', '2 ore', 'ora e mezza'],
  half_day: ['3h', '4h', 'mezza giornata', 'mattina', 'pomeriggio'],
  any: null, // nessun filtro tempo
};

// Mappa atmosphere → keywords atmosfera partner
const ATMOSPHERE_MAP = {
  autentica: ['autentica', 'locale', 'tradizionale', 'genuina', 'vera'],
  romantica: ['romantica', 'intima', 'suggestiva', 'romantico', 'intimo'],
  easy: ['casual', 'easy', 'informale', 'rilassato', 'senza pretese'],
  curata: ['raffinata', 'curata', 'elegante', 'sofisticata', 'premium'],
  vivace: ['vivace', 'animata', 'social', 'energica', 'movimentata'],
  slow: ['slow', 'rilassata', 'quieta', 'silenziosa', 'meditativa', 'pace'],
};

// Bonus piano partner (max 5 pt — non dominante)
const PLAN_BONUS = {
  discovery: 0,
  puglia_pro: 3,
  grande_puglia: 5,
};

// Titoli risultati dinamici
export const RESULT_TITLES = {
  mangiare: {
    solo: 'Il tuo tavolo giusto, adesso',
    coppia: 'Il posto perfetto per voi due',
    amici: 'Dove si mangia bene in compagnia',
    famiglia: 'Dove la famiglia è felice',
    default: 'Ecco dove mangiare adesso',
  },
  vedere: {
    solo: 'Solo tu e la bellezza della Puglia',
    coppia: 'Un posto da vedere insieme',
    amici: 'Da vedere assolutamente',
    famiglia: 'Un posto che stupisce tutti',
    default: 'Qualcosa di bello ti aspetta',
  },
  tappa: {
    solo: 'La tappa giusta per te adesso',
    coppia: 'Una scoperta tutta vostra',
    amici: 'Una tappa da raccontare',
    famiglia: 'Autentica, perfetta per tutti',
    default: 'Una tappa autentica ti aspetta',
  },
  relax: {
    solo: 'Il tuo momento di pace',
    coppia: 'Relax solo per voi due',
    amici: 'Staccare insieme, che lusso',
    famiglia: 'Un respiro per tutta la famiglia',
    default: 'Il posto giusto per staccare',
  },
  serata: {
    solo: 'Fai di stasera qualcosa di speciale',
    coppia: 'La serata che sognavi',
    amici: 'La serata giusta per il gruppo',
    famiglia: 'Una serata diversa, per tutti',
    default: 'La serata prende forma',
  },
};

export function getResultTitle(intent, companions) {
  const map = RESULT_TITLES[intent] || RESULT_TITLES.mangiare;
  return map[companions] || map.default;
}

// Microspiegazione personalizzata sotto ogni partner
export function getMicroExplanation(partner, answers) {
  const { intent, companions, time, atmosphere } = answers;
  const atm = (partner.atmosphere || []).map(a => a.toLowerCase());
  const target = (partner.ideal_target || []).map(t => t.toLowerCase());
  const cat = (partner.category || '').toLowerCase();

  // Regole priorità
  if (atmosphere === 'romantica' && atm.some(a => a.includes('roman') || a.includes('intim'))) {
    return 'Atmosfera romantica, ideale per voi due';
  }
  if (atmosphere === 'autentica' && (atm.some(a => a.includes('autent') || a.includes('local')))) {
    return 'Autentico, locale, genuino';
  }
  if (atmosphere === 'slow' && atm.some(a => a.includes('slow') || a.includes('quie') || a.includes('rila'))) {
    return 'Il ritmo slow che cercavi';
  }
  if (atmosphere === 'vivace' && atm.some(a => a.includes('vivac') || a.includes('anim'))) {
    return 'L\'energia giusta per questa sera';
  }
  if (atmosphere === 'curata') {
    return 'Curato, elegante, senza sbavature';
  }
  if (companions === 'famiglia' && target.some(t => t.includes('famig') || t.includes('bamb') || t.includes('kid'))) {
    return 'Ideale per tutta la famiglia';
  }
  if (companions === 'coppia') {
    return 'Perfetto per una coppia';
  }
  if (companions === 'amici') {
    return 'Ottimo in compagnia';
  }
  if (time === 'short') {
    return 'Perfetto se hai poco tempo';
  }
  if (time === 'half_day') {
    return 'Vale la mezza giornata';
  }
  if (intent === 'mangiare') {
    return 'Ottima scelta per mangiare bene adesso';
  }
  if (intent === 'serata') {
    return 'La scelta giusta per questa serata';
  }
  if (intent === 'relax') {
    return 'Ideale per staccare la spina';
  }

  return 'In linea con il tuo momento';
}

/**
 * Calcola score 0–100 per un partner rispetto alle risposte del wizard
 */
export function scorePartnerNow(partner, answers) {
  const { intent, companions, time, atmosphere } = answers;
  let score = 0;

  // ── INTENT MATCH (35 pt max) ──
  const intentData = INTENT_MAP[intent] || {};
  const catLower = (partner.category || '').toLowerCase();
  const subcatLower = (partner.subcategory || '').toLowerCase();

  // Category match (25 pt)
  const categoryHit = (intentData.categories || []).some(c =>
    catLower.includes(c) || subcatLower.includes(c)
  );
  if (categoryHit) score += 25;
  else if (catLower) score += 5; // categoria presente ma non ideale

  // Moment match (10 pt)
  const partnerMoments = (partner.ideal_moment || []).map(m => m.toLowerCase());
  const momentHit = (intentData.moments || []).some(im =>
    partnerMoments.some(pm => pm.includes(im) || im.includes(pm))
  );
  if (momentHit) score += 10;

  // ── ATMOSPHERE MATCH (25 pt max) ──
  const atmosphereKeywords = ATMOSPHERE_MAP[atmosphere] || [];
  const partnerAtm = (partner.atmosphere || []).map(a => a.toLowerCase());
  const atmMatches = atmosphereKeywords.filter(k =>
    partnerAtm.some(a => a.includes(k))
  ).length;
  score += Math.min(25, atmMatches * 13);

  // ── COMPANION MATCH (15 pt max) ──
  const companionKeywords = COMPANION_MAP[companions] || [];
  const partnerTarget = (partner.ideal_target || []).map(t => t.toLowerCase());
  const compMatches = companionKeywords.filter(k =>
    partnerTarget.some(t => t.includes(k) || k.includes(t))
  ).length;
  score += Math.min(15, compMatches * 8);

  // ── TIME MATCH (10 pt) ──
  if (time === 'any') {
    score += 5; // neutro
  } else {
    const timeKeywords = TIME_MAP[time] || [];
    const duration = (partner.experience_duration || '').toLowerCase();
    const timeHit = timeKeywords.some(t => duration.includes(t));
    if (timeHit) score += 10;
  }

  // ── PROFILE SCORE BONUS (10 pt max) ──
  const profileBonus = Math.round(((partner.profile_score || 0) / 100) * 10);
  score += profileBonus;

  // ── PLAN TIER BONUS (5 pt max — non dominante) ──
  score += PLAN_BONUS[partner.plan_tier] || 0;

  return Math.min(100, score);
}

/**
 * Ritorna i partner ordinati per score, con jitter opzionale per "Rigenera"
 */
export function rankPartnersNow(partners, answers, jitter = false) {
  return partners
    .map(p => {
      const base = scorePartnerNow(p, answers);
      const noise = jitter ? (Math.random() * 10 - 5) : 0; // ±5 pt random
      return { ...p, _nowScore: Math.max(0, Math.min(100, base + noise)) };
    })
    .sort((a, b) => b._nowScore - a._nowScore);
}

/**
 * Costruisce il mini percorso testuale dai top partner
 */
export function buildMiniPercorso(topPartners, intent) {
  if (topPartners.length < 2) return null;
  const [p1, p2] = topPartners;

  const intros = {
    mangiare: [`Inizia da ${p1.name}`, `poi prosegui verso ${p2.name}`],
    vedere: [`Parti da ${p1.name}`, `e scopri ${p2.name}`],
    tappa: [`Prima tappa: ${p1.name}`, `poi ${p2.name}`],
    relax: [`Rilassati a ${p1.name}`, `e chiudi con ${p2.name}`],
    serata: [`Aperitivo da ${p1.name}`, `poi la serata da ${p2.name}`],
  };

  const steps = intros[intent] || [`${p1.name}`, `poi ${p2.name}`];
  return {
    step1: { name: p1.name, logo: p1.logo_url },
    step2: { name: p2.name, logo: p2.logo_url },
    label1: steps[0],
    label2: steps[1],
  };
}
