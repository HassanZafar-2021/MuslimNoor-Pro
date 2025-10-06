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
            <PrayerTimes />
        </div>
    );
}

export default Dashboard;