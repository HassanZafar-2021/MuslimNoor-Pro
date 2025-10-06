import { useState, useEffect, useRef, useCallback } from 'react';
import { CalculationMethod, Coordinates, PrayerTimes as AdhanPrayerTimes} from 'adhan';
import '../App.css';

function PrayerTimes() {
    const [activePrayer, setActivePrayer] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [prayerTimes, setPrayerTimes] = useState({
        fajr: "", sunrise: "", dhuhr: "", asr: "", maghrib: "", isha: ""
    });
    const [adhanPrayerTimes, setAdhanPrayerTimes] = useState<AdhanPrayerTimes | null>(null);

    const adhanAudioRef = useRef<HTMLAudioElement>(null);
    const calculatePrayerTimes = useCallback(() => {
        if (!userLocation) 
            return;

        const coordinates = new Coordinates(userLocation.latitude, userLocation.longitude);
        const params = CalculationMethod.MuslimWorldLeague();
        const date = new Date();

        const adhanTimes = new AdhanPrayerTimes(coordinates, date, params);
        setAdhanPrayerTimes(adhanTimes);

        setPrayerTimes({
            fajr: adhanTimes.fajr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            sunrise: adhanTimes.sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            dhuhr: adhanTimes.dhuhr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            asr: adhanTimes.asr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            maghrib: adhanTimes.maghrib.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isha: adhanTimes.isha.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        });
    }, [userLocation]);

    useEffect(() => {
        if (adhanPrayerTimes) {
            const currentPrayer = adhanPrayerTimes.currentPrayer(new Date());
            setActivePrayer(currentPrayer);
        }
    }, [adhanPrayerTimes]);


    // Get user location when component loads
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
                    // Fallback to Mecca coordinates
                    setUserLocation({
                        latitude: 21.4225,
                        longitude: 39.8262
                    });
                }
            );
        }
    }, []);

    // Calculate prayer times when location changes
    useEffect(() => {
        if (userLocation) {
            calculatePrayerTimes();
        }
    }, [userLocation, calculatePrayerTimes]);

    const playAdhanAudio = () => {
        if (adhanAudioRef.current) {
            adhanAudioRef.current.play().catch(error => {
                console.error("Error playing adhan:", error);
            });
        }
    };

    return (
        <div className="prayer-times-container">
            <h2>Prayer Times</h2>
            {userLocation ? (
                <div>
                    <p><strong>Location:</strong> {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}</p>
                    {activePrayer && (
                        <p><strong>Current Prayer:</strong> {activePrayer}</p>
                    )}
                    <div className="prayer-times-grid">
                        <p><strong>Fajr:</strong> {prayerTimes.fajr}</p>
                        <p><strong>Sunrise:</strong> {prayerTimes.sunrise}</p>
                        <p><strong>Dhuhr:</strong> {prayerTimes.dhuhr}</p>
                        <p><strong>Asr:</strong> {prayerTimes.asr}</p>
                        <p><strong>Maghrib:</strong> {prayerTimes.maghrib}</p>
                        <p><strong>Isha:</strong> {prayerTimes.isha}</p>
                    </div>
                    <button onClick={calculatePrayerTimes} className="prayer-times-button">
                        Refresh Prayer Times
                    </button>
                    <audio ref={adhanAudioRef} src="/adhan.mp3" />
                    <button onClick={playAdhanAudio} className="prayer-times-button">
                        Play Adhan
                    </button>
                </div>
            ) : (
                <p>Getting your location for accurate prayer times...</p>
            )}
        </div>
    );

    
}

export default PrayerTimes;