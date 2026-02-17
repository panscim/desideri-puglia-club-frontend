// src/utils/levels.js

// ATTENZIONE: metti i tuoi file PNG in /public/levels
// E aggiorna i percorsi iconUrl se usi nomi diversi.

export const LEVELS = [
  {
    id: 1,
    slug: 'forester-gargano',
    name: 'Forester del Gargano',
    minPoints: 0,
    icon: '🌲',
    iconUrl: '/levels/foresta.png'
  },
  {
    id: 2,
    slug: 'custode-trulli',
    name: 'Custode dei Trulli',
    minPoints: 50,
    icon: '🧱',
    iconUrl: '/levels/trullo.png'
  },
  {
    id: 3,
    slug: 'mastro-panzerotto',
    name: 'Mastro Panzerotto',
    minPoints: 120,
    icon: '🔥',
    iconUrl: '/levels/panzerotto.png'
  },
  {
    id: 4,
    slug: 'navigatore-adriatico',
    name: "Navigatore dell'Adriatico",
    minPoints: 220,
    icon: '🌊',
    iconUrl: '/levels/adriatico.png'
  },
  {
    id: 5,
    slug: 'cavalier-castel-monte',
    name: 'Cavalier del Castel del Monte',
    minPoints: 350,
    icon: '🏰',
    iconUrl: '/levels/castel.png'
  },
  {
    id: 6,
    slug: 'cantore-taranta',
    name: 'Cantore della Taranta',
    minPoints: 500,
    icon: '🪗',
    iconUrl: '/levels/taranta.png'
  },
  {
    id: 7,
    slug: 'esploratore-masserie',
    name: 'Esploratore delle Masserie',
    minPoints: 700,
    icon: '🌾',
    iconUrl: '/levels/masseria.png'
  },
  {
    id: 8,
    slug: 'guardiano-ulivi',
    name: 'Guardiano degli Ulivi Secolari',
    minPoints: 950,
    icon: '🫒',
    iconUrl: '/levels/ulivi.png'
  },
  {
    id: 9,
    slug: 'figlio-maestrale',
    name: 'Figlio del Maestrale',
    minPoints: 1300,
    icon: '💨',
    iconUrl: '/levels/maestrale.png'
  },
  {
    id: 10,
    slug: 'leggenda-puglia',
    name: 'Leggenda di Puglia',
    minPoints: 1800,
    icon: '✨',
    iconUrl: '/levels/leggenda.png'
  }
]

// Ritorna il livello corrispondente ai punti totali
export function getLevelByPoints(points = 0) {
  const safePoints = Number(points) || 0

  // Prendiamo il livello con minPoints <= punti, più alto possibile
  let current = LEVELS[0]

  for (const lvl of LEVELS) {
    if (safePoints >= lvl.minPoints && lvl.minPoints >= current.minPoints) {
      current = lvl
    }
  }

  return current
}

// Progress verso il prossimo livello (percentuale + punti mancanti)
export function getProgressToNextLevel(points = 0) {
  const safePoints = Number(points) || 0
  const current = getLevelByPoints(safePoints)

  // Trova il prossimo livello
  const currentIndex = LEVELS.findIndex((l) => l.id === current.id)
  const next = LEVELS[currentIndex + 1] || null

  if (!next) {
    // ultimo livello: barra piena
    return {
      percentage: 100,
      pointsNeeded: 0,
      current,
      next: null
    }
  }

  const range = next.minPoints - current.minPoints
  const progressed = safePoints - current.minPoints
  const percentage = Math.max(0, Math.min(100, (progressed / range) * 100))

  return {
    percentage,
    pointsNeeded: Math.max(0, next.minPoints - safePoints),
    current,
    next
  }
}