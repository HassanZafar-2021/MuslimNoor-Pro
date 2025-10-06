import {useState, useEffect, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function QiblaCompass() {
    const navigate = useNavigate();
    const [direction, setDirection] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

    const calculateQiblaDirection = useCallback(() => {
        if (!userLocation) return;
        
        // Calculate Qibla direction using mathematical formula
        const meccaLat = 21.4225 * Math.PI / 180; // Mecca latitude in radians
        const meccaLng = 39.8262 * Math.PI / 180; // Mecca longitude in radians
        const userLat = userLocation.latitude * Math.PI / 180;
        const userLng = userLocation.longitude * Math.PI / 180;
        
        const deltaLng = meccaLng - userLng;
        
        const y = Math.sin(deltaLng) * Math.cos(meccaLat);
        const x = Math.cos(userLat) * Math.sin(meccaLat) - 
                  Math.sin(userLat) * Math.cos(meccaLat) * Math.cos(deltaLng);
        
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360; // Normalize to 0-360 degrees
        
        setDirection(bearing);
    }, [userLocation]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Fallback to a default location (e.g., Mecca)
                    setUserLocation({
                        latitude: 21.4225,
                        longitude: 39.8262
                    });
                }
            );
        }
    }, []);

    useEffect(() => {
        calculateQiblaDirection();
    }, [userLocation, calculateQiblaDirection]);

    return (
        <div className='qibla-compass-container'>
            <button 
                onClick={() => navigate('/')} 
                className="back-button">
                    Go Back 
            </button>
            <h2>Qibla Compass</h2>
            {direction !== null && userLocation ? (
                <div>
                    <p><strong>Your Location:</strong> {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}</p>
                    <p><strong>Qibla Direction:</strong> {direction.toFixed(1)}° from North</p>
                    <div className="compass">
                        <div
                            className="needle"
                            style={{ transform: `rotate(${direction}deg)` }}
                        >
                            🕋
                        </div>
                    </div>
                    <p>The Kaaba icon points toward Mecca</p>
                </div>
            ) : (
                <p>Getting your location for accurate Qibla direction...</p>
            )}
        </div>
    );
}

export default QiblaCompass;