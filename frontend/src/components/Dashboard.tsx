import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
// import QiblaCompass from './QiblaCompass';
// import QuranReader from './QuranReader';
// import AI from './AI';

function Dashboard() {
    const [message] = useState("Salam, welcome to MuslimNoor-Pro!")
    return (
        <div>
            <h1>{message}</h1>
            <div className="dashboard-grid">
                <Link to="/prayer-times" style={{ textDecoration: 'none' }}>
                    <div className="dashboard-card">
                        <h3>🕌 Prayer Times</h3>
                        <p>View accurate prayer times for your location</p>
                    </div>
                </Link>
                
                <div className="dashboard-card">
                    <h3>🧭 Qibla Compass</h3>
                    <p>Find the direction to Mecca</p>
                </div>
                
                <div className="dashboard-card">
                    <h3>📖 Read Quran</h3>
                    <p>Read the Holy Quran with translations</p>
                </div>
                
                <div className="dashboard-card">
                    <h3>🤖 AI Assistant</h3>
                    <p>Ask questions about Islam</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;