import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function QiblaCompass() {
    const navigate = useNavigate();
    const [direction, setDirection] = useState<number | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
    const [permissionRequested, setPermissionRequested] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

    const calculateQiblaDirection = useCallback(() => {
        if (!userLocation) return;

        const meccaLat = 21.4225 * Math.PI / 180;
        const meccaLng = 39.8262 * Math.PI / 180;
        const userLat = userLocation.latitude * Math.PI / 180;
        const userLng = userLocation.longitude * Math.PI / 180;

        const deltaLng = meccaLng - userLng;

        const y = Math.sin(deltaLng) * Math.cos(meccaLat);
        const x =
            Math.cos(userLat) * Math.sin(meccaLat) -
            Math.sin(userLat) * Math.cos(meccaLat) * Math.cos(deltaLng);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;

        setDirection(bearing);
    }, [userLocation]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Fallback to Mecca if location unavailable
                    setUserLocation({ latitude: 21.4225, longitude: 39.8262 });
                }
            );
        }
    }, []);

    // DeviceOrientation handler
    const handleOrientation = (ev: DeviceOrientationEvent) => {
        let heading: number | null = null;
        const evWithWebkit = ev as DeviceOrientationEvent & { webkitCompassHeading?: number };

        if (typeof evWithWebkit.webkitCompassHeading === 'number') {
            heading = evWithWebkit.webkitCompassHeading;
        } else if (ev.absolute === true && typeof ev.alpha === 'number') {
            heading = ev.alpha;
        } else if (typeof ev.alpha === 'number') {
            heading = 360 - ev.alpha;
        }

        if (heading !== null) {
            const normalized = ((heading % 360) + 360) % 360;
            setDeviceHeading(normalized);
        }
    };

    // Request iOS compass permission
    const requestCompassPermission = async () => {
        setPermissionRequested(true);
        try {
            const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
            if (DOE?.requestPermission) {
                const result = await DOE.requestPermission();
                if (result === 'granted') {
                    setPermissionGranted(true);
                    window.addEventListener('deviceorientation', handleOrientation, true);
                } else {
                    setPermissionGranted(false);
                }
            } else {
                setPermissionGranted(true); // permission not required
                window.addEventListener('deviceorientation', handleOrientation, true);
            }
        } catch (e) {
            console.warn('Compass permission failed', e);
            setPermissionGranted(false);
        }
    };

    useEffect(() => {
        if (permissionGranted) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [permissionGranted]);

    useEffect(() => {
        calculateQiblaDirection();
    }, [userLocation, calculateQiblaDirection]);

    const displayAngle = useMemo(() => {
        if (direction === null) return null;
        const h = deviceHeading ?? 0;
        return ((direction - h + 360) % 360);
    }, [direction, deviceHeading]);

    const needleRef = useRef<HTMLDivElement | null>(null);
    const arrowRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (displayAngle === null) return;
        const angleDeg = `${displayAngle}deg`;
        if (needleRef.current) needleRef.current.style.transform = `rotate(${angleDeg})`;
        if (arrowRef.current) arrowRef.current.style.transform = `rotate(${angleDeg})`;
    }, [displayAngle]);

    return (
        <div className="qibla-compass-container">
            <button onClick={() => navigate('/')} className="back-button">
                Go Back
            </button>
            <h2 className="bold-text">Qibla Compass</h2>

            {!permissionRequested && (
                <button onClick={requestCompassPermission} className="ai-button">
                    Enable Compass (iOS)
                </button>
            )}

            {direction !== null && userLocation ? (
                <div>
                    <p className="bold-text">
                        <strong>Your Location:</strong> {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}
                    </p>
                    <p className="bold-text">
                        <strong>Qibla Direction:</strong> {direction.toFixed(1)}° from North
                    </p>

                    <div className="compass">
                        <div className="compass-circle">
                            <div className="compass-north">N</div>
                            <div className="compass-east">E</div>
                            <div className="compass-south">S</div>
                            <div className="compass-west">W</div>
                        </div>
                        <div className="needle-container">
                            <div className="needle" ref={needleRef}>🕋</div>
                            <div className="qibla-arrow" ref={arrowRef} aria-hidden="true" />
                        </div>
                    </div>

                    <p className="bold-text">The Kaaba icon points toward Mecca</p>
                </div>
            ) : (
                <p className="bold-text">Getting your location for accurate Qibla direction...</p>
            )}

            {permissionRequested && permissionGranted === false && (
                <p className="bold-text" style={{ color: 'red' }}>
                    Compass access denied. Showing static Qibla direction.
                </p>
            )}
        </div>
    );
}

export default QiblaCompass;
