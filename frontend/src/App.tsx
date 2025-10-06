import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Dashboard from './components/Dashboard'
import PrayerTimes from './components/PrayerTimes'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/prayer-times" element={<PrayerTimes />} />
        </Routes>
      </div>
    </Router>
  )
}



export default App
