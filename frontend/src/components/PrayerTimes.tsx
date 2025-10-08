import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalculationMethod, Coordinates, PrayerTimes as AdhanPrayerTimes } from 'adhan';
import '../App.css';

const PrayerTimes: React.FC = () => {
  const navigate = useNavigate();
  const [activePrayer, setActivePrayer] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState({ fajr: '', sunrise: '', dhuhr: '', asr: '', maghrib: '', isha: '' });
  const [adhanPrayerTimes, setAdhanPrayerTimes] = useState<AdhanPrayerTimes | null>(null);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'requesting' | 'granted' | 'denied' | 'error' | 'fallback'>('unknown');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const adhanAudioRef = useRef<HTMLAudioElement | null>(null);

  const calculatePrayerTimes = useCallback(() => {
    if (!userLocation) return;

    // Set loading state while computing
    setLoading(true);
    try {
      const coordinates = new Coordinates(userLocation.latitude, userLocation.longitude);
      const params = CalculationMethod.MuslimWorldLeague();
      const date = new Date();

      const adhanTimes = new AdhanPrayerTimes(coordinates, date, params);
      setAdhanPrayerTimes(adhanTimes);

      setPrayerTimes({
        fajr: adhanTimes.fajr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sunrise: adhanTimes.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dhuhr: adhanTimes.dhuhr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        asr: adhanTimes.asr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        maghrib: adhanTimes.maghrib.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isha: adhanTimes.isha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } finally {
      // small timeout to make spinner visible for very fast ops
      setTimeout(() => setLoading(false), 150);
    }
  }, [userLocation]);

  // Determine current prayer by manual comparison of times
  useEffect(() => {
    if (!adhanPrayerTimes) return;
    const now = new Date();

    const times: { name: string; date: Date }[] = [
      { name: 'fajr', date: adhanPrayerTimes.fajr },
      { name: 'sunrise', date: adhanPrayerTimes.sunrise },
      { name: 'dhuhr', date: adhanPrayerTimes.dhuhr },
      { name: 'asr', date: adhanPrayerTimes.asr },
      { name: 'maghrib', date: adhanPrayerTimes.maghrib },
      { name: 'isha', date: adhanPrayerTimes.isha }
    ];

    times.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Find the most recent prayer time that is <= now
    let current: { name: string; date: Date } | null = null;
    for (const t of times) {
      if (t.date.getTime() <= now.getTime()) current = t;
      else break;
    }

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    if (current) {
      setActivePrayer(capitalize(current.name));
      console.log('Current prayer (manual):', current.name, current.date.toISOString());
      return;
    }

    // No current prayer -> find next today
    const nextToday = times.find(t => t.date.getTime() > now.getTime());
    if (nextToday) {
      const timeStr = nextToday.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const label = `Next: ${capitalize(nextToday.name)} at ${timeStr}`;
      setActivePrayer(label);
      console.log('No current prayer —', label);
      return;
    }

    // After isha: compute tomorrow fajr
    if (userLocation) {
      try {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const coords = new Coordinates(userLocation.latitude, userLocation.longitude);
        const params = CalculationMethod.MuslimWorldLeague();
        const nextDayTimes = new AdhanPrayerTimes(coords, tomorrow, params);
        const fajrTomorrow = nextDayTimes.fajr;
        const timeStr = fajrTomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const label = `Next: Fajr (tomorrow) at ${timeStr}`;
        setActivePrayer(label);
        console.log('After isha —', label);
        return;
      } catch (e) {
        console.warn('Could not compute next day fajr', e);
      }
    }

    setActivePrayer('None');
    console.log('Current prayer: none');
  }, [adhanPrayerTimes, userLocation]);

  // Load saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('savedLocation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.latitude && parsed.longitude) {
          setUserLocation({ latitude: parsed.latitude, longitude: parsed.longitude });
          setLocationStatus('granted');
          return;
        }
      }
    } catch {
      // ignore
    }

    setLocationStatus('unknown');
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setUserLocation(coords);
        try { localStorage.setItem('savedLocation', JSON.stringify(coords)); } catch (e) { console.warn('save failed', e); }
        setLocationStatus('granted');
      },
      (error) => {
        console.error('Error getting location:', error);
        if (error && (error as GeolocationPositionError).code === 1) setLocationStatus('denied');
        else setLocationStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (userLocation) calculatePrayerTimes();
  }, [userLocation, calculatePrayerTimes]);

  const playAdhanAudio = () => {
    if (adhanAudioRef.current) adhanAudioRef.current.play().catch(e => console.error('Adhan play error', e));
  };

  return (
    <div className="prayer-times-container">
      <button onClick={() => navigate('/')} className="back-button">Go Back</button>
      <h2>Prayer Times</h2>

      {userLocation ? (
        <div>
          <p><strong>Location:</strong> {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}</p>
          {activePrayer && (<p><strong>Current Prayer:</strong> {activePrayer}</p>)}

          <div className="prayer-times-grid">
            <p><strong>Fajr:</strong> {prayerTimes.fajr}</p>
            <p><strong>Sunrise:</strong> {prayerTimes.sunrise}</p>
            <p><strong>Dhuhr:</strong> {prayerTimes.dhuhr}</p>
            <p><strong>Asr:</strong> {prayerTimes.asr}</p>
            <p><strong>Maghrib:</strong> {prayerTimes.maghrib}</p>
            <p><strong>Isha:</strong> {prayerTimes.isha}</p>
          </div>

          <button onClick={calculatePrayerTimes} className="prayer-times-button" disabled={loading}>
            {loading ? (
              <span>
                Refreshing
                <span className="spinner" aria-hidden="true" />
              </span>
            ) : (
              'Refresh Prayer Times'
            )}
          </button>
          <audio ref={adhanAudioRef} src="/adhan.mp3" />
          <button onClick={playAdhanAudio} className="prayer-times-button">Play Adhan</button>
        </div>
      ) : (
        <div>
          {locationStatus === 'unknown' && (
            <div>
              <p>We don't have your location yet. You can detect it automatically or enter it manually.</p>
              <button onClick={detectLocation} className="prayer-times-button">Detect my location</button>
              <button onClick={() => { setUserLocation({ latitude: 21.4225, longitude: 39.8262 }); setLocationStatus('fallback'); }} className="prayer-times-button">Use Mecca (manual)</button>
            </div>
          )}

          {locationStatus === 'requesting' && (<p>Requesting device location… Please allow location access in your browser.</p>)}

          {locationStatus === 'denied' && (
            <div>
              <p>Location permission was denied. You can enter your location manually, use IP-based location, or enable location in your browser settings.</p>
              <p><small>To enable: click the lock icon next to the address bar → Site settings → Location → Allow</small></p>
              <div className="manual-input-row">
                <label>Latitude: <input value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="e.g. 51.5074" /></label>
                <label className="manual-label">Longitude: <input value={manualLng} onChange={e => setManualLng(e.target.value)} placeholder="e.g. -0.1278" /></label>
                <button onClick={() => {
                  const lat = parseFloat(manualLat);
                  const lng = parseFloat(manualLng);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    const coords = { latitude: lat, longitude: lng };
                    setUserLocation(coords);
                    try { localStorage.setItem('savedLocation', JSON.stringify(coords)); } catch (e) { console.warn('Could not save location to localStorage', e); }
                    setLocationStatus('granted');
                  } else {
                    alert('Please enter valid numeric latitude and longitude');
                  }
                }} className="prayer-times-button">Submit</button>
              </div>
            </div>
          )}

          {locationStatus === 'error' && (
            <div>
              <p>Unable to get device location. You can enter coordinates manually or try again.</p>
              <button onClick={detectLocation} className="prayer-times-button">Try again</button>
            </div>
          )}

          {locationStatus === 'fallback' && (<p>Using fallback location. You can change it with the buttons above.</p>)}

        </div>
      )}
    </div>
  );
};

export default PrayerTimes;