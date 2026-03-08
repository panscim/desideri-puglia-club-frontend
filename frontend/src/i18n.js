import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationIT from './locales/it/translation.json';
import translationEN from './locales/en/translation.json';

// Le risorse di traduzione
const resources = {
    it: {
        translation: translationIT
    },
    en: {
        translation: translationEN
    }
};

i18n
    // Rileva la lingua dell'utente
    .use(LanguageDetector)
    // Passa l'istanza i18n a react-i18next
    .use(initReactI18next)
    // Inizializza i18next
    .init({
        resources,
        supportedLngs: ['it', 'en'], // Lingue supportate esplicitamente
        nonExplicitSupportedLngs: true, // Permette a 'en-US' di essere gestito da 'en'
        fallbackLng: 'it', // Lingua di default se quella rilevata non è disponibile
        debug: true, // Output console per debug

        interpolation: {
            escapeValue: false // React protegge già dall'XSS
        },

        // Configurazioni rilevamento lingua
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'], // Salva la preferenza
        }
    });

export default i18n;
