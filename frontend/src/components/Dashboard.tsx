import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function Dashboard() {
    const [message] = useState("Salam, welcome to MuslimNoor-Pro!")
    return (
        <div className='custom-border'>
            <aside className='side'>
                <img src="../public/moon-icon.png" alt='Moon Icon' id='moon1' />
            </aside>

            <aside className='side'>
                <img src="../public/moon-icon.png" alt='Star Icon' id='moon2'/>
            </aside>

            <aside className='side'>
                <img src="../public/moon-icon.png" alt='Star Icon' id='moon3'/>
            </aside>

            <aside className='side'>
                <img src="../public/moon-icon.png" alt='Star Icon' id='moon4'/>
            </aside>

            <h1 className='header-text'>{message}</h1>
            <div className="dashboard-grid">
                <Link to="/prayer-times" style={{ textDecoration: 'none' }}>
                    <div className="dashboard-card">
                        <h3>🕌 Prayer Times</h3>
                        <p>View accurate prayer times for your location</p>
                    </div>
                </Link>
                
                <Link to="/qibla-compass" style={{ textDecoration: 'none' }}
>
                <div className="dashboard-card">
                    <h3>🧭 Qibla Compass</h3>
                    <p>Find the direction to Mecca</p>
                </div>
                </Link>
                
                <Link to="/quran-reader" style={{ textDecoration: 'none' }}>
                <div className="dashboard-card">
                    <h3>📖 Read Quran</h3>
                    <p>Read the Holy Quran with translations</p>
                </div>
                </Link>
                <Link to="/ai" style={{ textDecoration: 'none' }}>
                <div className="dashboard-card">
                    <h3>🤖 AI Assistant</h3>
                    <p>Ask questions about Islam</p>
                </div>
                </Link>
            </div>
        </div>
    );
}

export default Dashboard;