import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n' // Startup i18n
import App from './App.jsx'
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa'

// Register Service Worker per PWA
registerServiceWorker()

// Setup install prompt
setupInstallPrompt()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
