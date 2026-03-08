import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        // Usa resolvedLanguage per gestire en-US come en
        const current = i18n.resolvedLanguage || i18n.language;
        const newLang = current && current.startsWith('it') ? 'en' : 'it';
        i18n.changeLanguage(newLang);
    };

    // Controlla se la lingua corrente (o risolta) inizia con 'it'
    const isIt = (i18n.resolvedLanguage || i18n.language || '').startsWith('it');

    return (
        <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-sand/30 hover:bg-sand/50 transition-colors text-olive-dark text-sm font-medium ${className}`}
            aria-label="Switch Language"
        >
            <Globe className="w-4 h-4" />
            <span>{isIt ? 'IT' : 'EN'}</span>
        </button>
    );
};

export default LanguageSwitcher;
