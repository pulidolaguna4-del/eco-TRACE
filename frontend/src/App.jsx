import { Routes, Route, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'

import Login from './pages/Login'
import Register from './pages/Register'
import RecuperarPassword from './pages/RecuperarPassword'
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Perfil from './pages/Perfil'
import Admin from './pages/Admin'
import MisPuntos from './pages/MisPuntos'

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

        {/* HOME */}
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/home"
          element={<Home />}
        />

        {/* AUTENTICACIÓN */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/recuperar-password"
          element={<RecuperarPassword />}
        />

        {/* MAPA */}
        <Route
          path="/mapa"
          element={<Mapa />}
        />

        {/* PERFIL Y MIS PUNTOS */}
        <Route
          path="/perfil"
          element={<Perfil />}
        />

        <Route
          path="/mis-puntos"
          element={<MisPuntos />}
        />

        {/* ADMINISTRADOR */}
        <Route
          path="/admin"
          element={<Admin />}
        />

      </Routes>
    </>
  )
}

function App() {
  return <AppContent />
}

export default App
