import React from 'react';
import { useState } from 'react';
import PrayerTimes from './PrayerTimes';
// import QiblaCompass from './QiblaCompass';
// import QuranReader from './QuranReader';
// import AI from './AI';

function Dashboard() {
    const [message] = useState("Salam, welcome to MuslimNoor-Pro!")
    return (
        <div>
            <h1>{message}</h1>
            <div>
                <PrayerTimes />
                <div>QiblaCompass - Coming Soon</div>
            </div>
            <div>
                <div>QuranReader - Coming Soon</div>
                <div>AI Assistant - Coming Soon</div>
            </div>
        </div>
    );
}

export default Dashboard;