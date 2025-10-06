import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [message] = useState("Salam, welcome to MuslimNoor-Pro!")
  return (
    <div className="header">
     <p>{message}</p>      
   </div>
  )
}



export default App
