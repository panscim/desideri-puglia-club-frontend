import { useState, useEffect, useRef } from 'react';

export function useGeolocation(options = {}) {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [isWatching, setIsWatching] = useState(false);
    const watchId = useRef(null);

    const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
        ...options
    };

    const startWatching = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsWatching(true);
        watchId.current = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                });
                setError(null);
            },
            (err) => {
                setError(err.message);
            },
            defaultOptions
        );
    };

    const stopWatching = () => {
        if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
        }
        setIsWatching(false);
    };

    useEffect(() => {
        // Auto-start if requested
        startWatching();

        return () => stopWatching();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { location, error, isWatching, startWatching, stopWatching };
}
