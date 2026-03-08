import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n' // Startup i18n
import '@fontsource/geist-sans'
import App from './App.jsx'
import { registerServiceWorker } from './utils/pwa'

// Register Service Worker per PWA
registerServiceWorker()


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
