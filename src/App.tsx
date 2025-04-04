import { useState } from 'react'

const App = () => {
  const [darkMode, setDarkMode] = useState(false)

  const turnOnDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className={`p-4 justify-center items-center flex h-screen flex-col transition-colors duration-300 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'
        }`}>
        <button
          onClick={turnOnDarkMode}
          className={`fixed top-4 right-4 z-50 p-2 rounded-full shadow hover:scale-105 transition ${darkMode ? 'bg-white text-black' : 'bg-black text-white'
            }`}
        >
          {darkMode ? '☀️' : '🌕'}
        </button>

        <h1 className="text-3xl font-bold mb-4">Hello Tailwind</h1>
        <p className="text-lg lowercase">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. ...
        </p>
        <p className='text-2xl'>Hello World</p>
      </div>
    </div>
  )
}

export default App
