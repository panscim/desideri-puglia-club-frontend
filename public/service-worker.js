const CACHE_NAME = 'desideri-puglia-v2'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install Service Worker (solo pre-cache base)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  )
})

// ❌ NIENTE FETCH HANDLER
// Per ora lasciamo passare tutte le richieste direttamente alla rete,
// così non interferiamo con Supabase, Stripe, ecc.

// Activate Service Worker e pulisci vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    )
  )
})

// Push Notifications (resta uguale)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const options = {
    body: data.body || 'Hai una nuova notifica!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id,
    },
    actions: [
      { action: 'explore', title: 'Apri' },
      { action: 'close', title: 'Chiudi' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Desideri di Puglia Club',
      options
    )
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'))
  }
})