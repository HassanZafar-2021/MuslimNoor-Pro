import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './components/Dashboard'
import PrayerTimes from './components/PrayerTimes'
import QiblaCompass from './components/QiblaCompass'
import QuranReader from './components/QuranReader'
import AI from './components/AI'
import LocalMosque from './components/localmosque'
import Duas from './components/Duas'


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prayer-times" element={<PrayerTimes />} />
          <Route path="/qibla-compass" element={<QiblaCompass />} />
          <Route path="/quran-reader" element={<QuranReader />} />
          <Route path="/duas" element={<Duas />} />
          <Route path="/local-mosque" element={<LocalMosque />} />
          <Route path="/ai" element={<AI />} />

        </Routes>
      </div>
    </Router>
  )
}

export default App
