import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Placeholder for future Map implementation
// Currently this route exists but no real content was defined in the specific task.
// Creating a simple redirect or maintenance page to prevent crash.

export default function Mappa() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="bg-sand/30 p-6 rounded-full mb-6 animate-pulse">
                <MapPin className="w-16 h-16 text-olive-dark" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-olive-dark mb-2">Mappa Interattiva</h1>
            <p className="text-olive-light max-w-md">
                Stiamo lavorando alla nuova mappa interattiva per esplorare la Puglia.
                Nel frattempo, usa l'Album per trovare i luoghi!
            </p>

            <Link
                to="/album"
                className="mt-8 px-6 py-3 bg-gold text-white font-bold rounded-xl shadow-lg hover:bg-gold/90 transition-all"
            >
                Vai all'Album
            </Link>
        </div>
    );
}
