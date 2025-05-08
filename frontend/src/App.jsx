import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginWithWebcam from './components/LoginPage'
import Natasha from './components/Natasha'

function App() {
  const [user, setUser] = useState(
   )

  return (
    <>
     {/* <LoginWithWebcam user={user} setUser={setUser} /> */}
     <Natasha/>
    </>
  )
}

export default App
