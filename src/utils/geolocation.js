import { Geolocation } from '@capacitor/geolocation';

export function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

export function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

export const getCurrentPosition = async () => {
    try {
        const hasPermission = await Geolocation.checkPermissions();
        if (hasPermission.location !== 'granted') {
            const request = await Geolocation.requestPermissions();
            if (request.location !== 'granted') {
                throw new Error('Permessi di geolocalizzazione negati.');
            }
        }

        const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });

        return {
            latitude: coordinates.coords.latitude,
            longitude: coordinates.coords.longitude,
            accuracy: coordinates.coords.accuracy
        };
    } catch (error) {
        console.error('Errore durante il recupero della posizione:', error);
        throw error;
    }
};

export const isUserWithinRadius = async (targetLat, targetLon, radiusMeters = 50) => {
    if (!targetLat || !targetLon) {
        throw new Error('Coordinate del target mancanti o non valide.');
    }

    const currentCoords = await getCurrentPosition();
    const distanceMeters = calculateDistance(
        currentCoords.latitude, currentCoords.longitude,
        targetLat, targetLon
    );

    return {
        isWithin: distanceMeters <= radiusMeters,
        distanceMeters,
        currentCoords
    };
};
