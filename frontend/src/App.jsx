import { Routes, Route, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'

import Login from './pages/Login'
import Register from './pages/Register'
import RecuperarPassword from './pages/RecuperarPassword'
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Perfil from './pages/Perfil'

function AppContent() {
  const location = useLocation()

  // El Navbar no aparece en Login, Registro
  // ni Recuperación de contraseña
  const ocultarNavbar =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/recuperar-password'

  return (
    <>
      {!ocultarNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/recuperar-password"
          element={<RecuperarPassword />}
        />

        <Route path="/mapa" element={<Mapa />} />

        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </>
  )
}

function App() {
  return <AppContent />
}

export default App