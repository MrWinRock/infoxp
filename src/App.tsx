import { Route, Routes } from 'react-router-dom'
import Navbar from './components/navbar/Navbar'
import Home from './components/home/Home'
import Genre from './components/genre/Genre'
import GenrePage from './components/genre/GenrePage'
import Games from './components/games/Games'
import GamesPage from './components/games/GamesPage'
import Chat from './components/chat/Chat'
import Profile from './components/profile/Profile'
import Login from './components/auth/Login'
import Register from './components/auth/Register'

const App = () => {

  return (
    <div className={`bg-[#2D333C] text-[#DCDEDF] min-h-screen`}>
      <div className="w-full flex justify-center pt-8">
        <Navbar />
      </div>
      <div className="mt-12 p-4 flex flex-col items-center transition-colors duration-300 text-[18px]">

        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/genre' element={<Genre />} />
          <Route path='/genre/:name' element={<GenrePage />} />
          <Route path='/games' element={<Games />} />
          <Route path='/games/:id' element={<GamesPage />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
        </Routes>

      </div>
    </div>
  )
}

export default App