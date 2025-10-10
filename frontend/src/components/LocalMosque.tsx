import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';

interface Mosque {
    place_id: string;
    name: string;
    vicinity?: string;
    geometry?: { location?: { lat: number; lng: number } };
}

function LocalMosque(): ReactElement {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const fetchMosques = useCallback(async (pageToken?: string) => {
        if (!coords) return;

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                lat: String(coords.lat),
                lng: String(coords.lng),
                radius: '10000',
                type: 'mosque'
            });
            if (pageToken) params.append('page_token', pageToken);

            const res = await fetch(`${BACKEND_URL}/api/places/nearby?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                throw new Error(data.message || data.status);
            }

            const results: Mosque[] = (data.results || []).map((r: any) => ({
                place_id: r.place_id,
                name: r.name,
                vicinity: r.vicinity,
                geometry: r.geometry
            }));

            if (pageToken) {
                setMosques(prev => [...prev, ...results]);
            } else {
                setMosques(results);
            }

            // Sometimes next_page_token is returned but not valid immediately
            if (data.next_page_token) {
                setTimeout(() => setNextPageToken(data.next_page_token), 2000); // small delay
            } else {
                setNextPageToken(null);
            }

        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    }, [coords, BACKEND_URL]);

    // Get user's location
    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            err => setError('Unable to get location: ' + err.message)
        );
    }, []);

    // Fetch mosques once coords is available
    useEffect(() => {
        if (coords) fetchMosques();
    }, [coords, fetchMosques]);

    return (
        <div className='local-mosque-container'>
            <button 
                onClick={() => window.history.back()} 
                className="back-button">
                Back
            </button>
            <h2>Local Mosque Finder</h2>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && mosques.length === 0 && <p>No mosques found nearby.</p>}

            <ul>
                {mosques.map(m => (
                    <li key={m.place_id}>
                        <strong>{m.name}</strong>{m.vicinity && ` — ${m.vicinity}`}
                    </li>
                ))}
            </ul>

            {nextPageToken && (
                <button onClick={() => fetchMosques(nextPageToken)} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}
        </div>
    );
}

export default LocalMosque;
