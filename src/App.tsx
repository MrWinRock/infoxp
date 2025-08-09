import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/navbar/Navbar'
import Home from './components/home/Home'
import Genre from './components/genre/Genre'
import Games from './components/games/Games'
import Chat from './components/chat/Chat'
import Login from './components/auth/Login'
import Register from './components/auth/Register'

const App = () => {
  const [darkMode, setDarkMode] = useState(true)

  const turnOnDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <div className={`${darkMode ? 'bg-[#2D333C] text-[#DCDEDF]' : 'bg-[#ddd] text-[#171d25]'} min-h-screen`}>
      <div className="w-full flex justify-center pt-8">
        <Navbar />
      </div>
      <div className="mt-12 p-4 flex flex-col items-center transition-colors duration-300 text-[18px]">
        <button
          onClick={turnOnDarkMode}
          className={`fixed bottom-4 left-4 z-50 p-2 rounded-full shadow hover:scale-105 transition ${darkMode ? 'bg-[#ddd] text-[#171d25]' : 'bg-[#2D333C] text-[#DCDEDF]'
            }`}
        >
          {darkMode ? '☀️' : '🌕'}
        </button>

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/genre' element={<Genre />} />
          <Route path='/games' element={<Games />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
        </Routes>
      </div>
    </div>
  )
}

export default App