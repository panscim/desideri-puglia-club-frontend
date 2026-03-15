// =========================================================
// Desideri di Puglia — Partner Matching & Scoring
// =========================================================

// Maps user intent options to partner categories
const INTENT_CATEGORY_MAP = {
  mangiare:      ['Ristorante','Pizzeria','Osteria','Trattoria','Bistrot','Street food','Seafood','Fine dining','Brunch'],
  esperienza:    ['Esperienze e Tour','Laboratorio','Cooking class','Tour'],
  relax:         ['Benessere & Relax','Spa','Beach club','Wellness'],
  serata:        ['Nightlife & Social','Cocktail bar','Wine bar','Live music'],
  shopping:      ['Shopping Locale & Artigianato','Bottega','Ceramica'],
  cultura:       ['Cultura, Eventi & Intrattenimento','Museo','Galleria'],
  cibo_locale:   ['Food & Specialità Locali','Enoteca','Cantina','Caseificio'],
  dormire:       ['Ospitalità','B&B','Hotel','Masseria','Agriturismo'],
};

const BUDGET_ORDER = ['low','medium','premium','luxury'];

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
}

function arrayOverlap(a = [], b = []) {
  return a.filter(x => b.includes(x)).length;
}

/**
 * Score a partner against user saga preferences.
 * Returns 0–100 integer.
 * If no prefs, returns profile_score (discovery sort).
 */
export function scorePartner(partner, prefs, userPos = null) {
  if (!prefs) return partner.profile_score || 0;

  let score = 0;

  // 1. Category / intent match (0–30)
  const partnerCat = partner.category || '';
  const intentMatches = (prefs.intent || []).some(intent => {
    const cats = INTENT_CATEGORY_MAP[intent] || [];
    return cats.some(c => partnerCat.toLowerCase().includes(c.toLowerCase()));
  });
  if (intentMatches) score += 30;
  else score += 5; // small base so nothing is zero

  // 2. Budget match (0–15)
  const ui = BUDGET_ORDER.indexOf(prefs.budget_pref);
  const pi = BUDGET_ORDER.indexOf(partner.price_range);
  if (ui !== -1 && pi !== -1) {
    if (ui === pi) score += 15;
    else if (Math.abs(ui - pi) === 1) score += 7;
  }

  // 3. Moment match (0–15)
  if (prefs.moment && (partner.ideal_moment || []).includes(prefs.moment)) score += 15;

  // 4. Atmosphere overlap (0–10)
  const atmOverlap = arrayOverlap(prefs.atmosphere || [], partner.atmosphere || []);
  score += Math.min(10, atmOverlap * 5);

  // 5. Companions / target match (0–10)
  if (prefs.companions && (partner.ideal_target || []).includes(prefs.companions)) score += 10;

  // 6. Tag overlap (0–20)
  const tagIds = (partner.tags || []).map(t => t.tag_id || t);
  const userTagContext = [
    ...(prefs.interests || []),
    ...(prefs.atmosphere || []),
    prefs.moment,
    prefs.companions,
  ].filter(Boolean);
  const tagOverlap = tagIds.filter(t => userTagContext.includes(t)).length;
  score += Math.min(20, tagOverlap * 4);

  // 7. Profile completeness bonus (0–10)
  score += Math.floor(((partner.profile_score || 0) / 100) * 10);

  // 8. GPS proximity bonus (0–10)
  if (userPos && partner.latitude && partner.longitude) {
    const dist = haversineKm(userPos, { lat: partner.latitude, lng: partner.longitude });
    if (dist < 1)  score += 10;
    else if (dist < 5)  score += 7;
    else if (dist < 20) score += 3;
  }

  return Math.min(100, score);
}

/**
 * Calculate profile completeness score (0–100).
 * Used to update partners.profile_score.
 */
export function calcProfileScore(partner, tagCount = 0) {
  const checks = [
    [partner.name,                5],
    [partner.description,         10],
    [partner.cover_image_url,     10],
    [partner.logo_url,            5],
    [partner.city && partner.address, 8],
    [partner.latitude && partner.longitude, 5],
    [partner.phone || partner.whatsapp_phone, 5],
    [partner.website_url || partner.instagram_url, 5],
    [partner.category,            5],
    // Advanced fields
    [partner.subcategory,         5],
    [partner.price_range,         5],
    [partner.atmosphere?.length,  5],
    [partner.ideal_moment?.length,5],
    [partner.ideal_target?.length,5],
    [tagCount >= 3,               10],
    [partner.features && Object.keys(partner.features).length >= 2, 5],
    [partner.languages?.length > 1, 2],
  ];
  const total = checks.reduce((sum, [cond, pts]) => sum + (cond ? pts : 0), 0);
  return Math.min(100, total);
}

/**
 * Sort partners by score descending.
 */
export function rankPartners(partners, prefs, userPos = null) {
  return [...partners]
    .map(p => ({ ...p, _score: scorePartner(p, prefs, userPos) }))
    .sort((a, b) => b._score - a._score);
}
