import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Mapa from './pages/Mapa'

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mapa" element={<Mapa />} />
      </Routes>
    </>
  )
}

export default App

