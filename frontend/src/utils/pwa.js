// Register Service Worker for PWA
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js')
      console.log('Service Worker registered:', registration)
      
      // Controlla aggiornamenti
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nuovo service worker disponibile
            console.log('New service worker available')
            // Opzionalmente mostra un messaggio all'utente per ricaricare
          }
        })
      })
      
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

// Request Notification Permission
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}

// Show Local Notification (non push)
export const showLocalNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    })
  }
}

// Check if app is installed (PWA)
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://')
}

// Prompt to install PWA
let deferredPrompt
export const setupInstallPrompt = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

export const promptInstall = async () => {
  if (!deferredPrompt) {
    return false
  }

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  
  return outcome === 'accepted'
}
