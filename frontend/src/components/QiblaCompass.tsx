import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function QiblaCompass() {
    const navigate = useNavigate();
    const [direction, setDirection] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
    // heading reported by device sensors (degrees from North). null when unavailable.
    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);

    const calculateQiblaDirection = useCallback(() => {
        if (!userLocation) 
            return;
        
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

    // Listen for device orientation (compass) when available. On iOS this requires
    // permission via DeviceOrientationEvent.requestPermission(). We try to request it
    // when necessary; otherwise we attach the listener and map the event to a heading.
    useEffect(() => {
        let mounted = true;

        const handleOrientation = (ev: DeviceOrientationEvent) => {
            if (!mounted) return;
            let heading: number | null = null;
            // Use a safer typed accessor for webkitCompassHeading
            const evWithWebkit = ev as DeviceOrientationEvent & { webkitCompassHeading?: number };
            if (typeof evWithWebkit.webkitCompassHeading === 'number') {
                heading = evWithWebkit.webkitCompassHeading;
            } else if (ev.absolute === true && typeof ev.alpha === 'number') {
                // absolute alpha often directly corresponds to compass heading
                heading = ev.alpha as number;
            } else if (typeof ev.alpha === 'number') {
                // fallback mapping used by some Android browsers
                heading = 360 - ev.alpha;
            }

            if (heading !== null) {
                const normalized = ((heading % 360) + 360) % 360;
                setDeviceHeading(normalized);
            }
        };

        const start = async () => {
            try {
                // iOS 13+ requires permission
                const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
                if (DOE && typeof DOE.requestPermission === 'function') {
                    try {
                        const perm = await DOE.requestPermission();
                        if (perm === 'granted') {
                            window.addEventListener('deviceorientation', handleOrientation, true);
                        } else {
                            console.warn('DeviceOrientation permission not granted');
                        }
                    } catch (e) {
                        console.warn('DeviceOrientation permission request failed', e);
                    }
                } else {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                }
            } catch (e) {
                console.warn('Could not attach deviceorientation listener', e);
            }
        };

        start();

        return () => {
            mounted = false;
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, []);

    // Optional: watch position so direction updates while user is moving (car/laptop GPS)
    useEffect(() => {
        if (!navigator.geolocation) return;
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            },
            () => { /* ignore watch errors */ },
            { enableHighAccuracy: true, maximumAge: 5000 }
        );
        return () => navigator.geolocation.clearWatch(id);
    }, []);

    useEffect(() => {
        calculateQiblaDirection();
    }, [userLocation, calculateQiblaDirection]);

    // compute display angle: if device heading available, rotate by (bearing - heading)
    const displayAngle = useMemo(() => {
        if (direction === null) return null;
        const h = deviceHeading ?? 0;
        const a = direction - h;
        return ((a % 360) + 360) % 360;
    }, [direction, deviceHeading]);

    // refs for needle and arrow to set transform without inline JSX styles (satisfy linter)
    const needleRef = useRef<HTMLDivElement | null>(null);
    const arrowRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (displayAngle === null) return;
        const angleDeg = `${displayAngle}deg`;
        if (needleRef.current) {
            needleRef.current.style.transform = `rotate(${angleDeg})`;
        }
        if (arrowRef.current) {
            arrowRef.current.style.transform = `rotate(${angleDeg})`;
        }
    }, [displayAngle]);

    return (
        <div className='qibla-compass-container'>
            <button 
                onClick={() => navigate('/')} 
                className="back-button">
                    Go Back 
            </button>
            <h2 className='bold-text'>Qibla Compass</h2>
            {direction !== null && userLocation ? (
                <div>
                    <p className='bold-text'><strong>Your Location:</strong> {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}</p>
                    <p className='bold-text'><strong>Qibla Direction:</strong> {direction.toFixed(1)}° from North</p>
                    <div className="compass">
                        <div className="compass-circle">
                            <div className="compass-north">N</div>
                            <div className="compass-east">E</div>
                            <div className="compass-south">S</div>
                            <div className="compass-west">W</div>
                        </div>
                                                <div className="needle-container">
                                                    <div className="needle" ref={needleRef}>🕋</div>
                                                    {/* Arrow pointing toward the Qibla (rotates together with needle) */}
                                                    <div className="qibla-arrow" ref={arrowRef} aria-hidden="true" />
                                                </div>
                    </div>
                    <p className='bold-text'>The Kaaba icon points toward Mecca</p>
                </div>
            ) : (
                <p className='bold-text'>Getting your location for accurate Qibla direction...</p>
            )}
        </div>
    );
}

export default QiblaCompass;