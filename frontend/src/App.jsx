import { Routes, Route, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'
import { ChatProvider } from './context/ChatContext'

import Autenticacion from './pages/Autenticacion'
import RecuperarPassword from './pages/RecuperarPassword'
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Perfil from './pages/Perfil'
import Admin from './pages/Admin'
import MisPuntos from './pages/MisPuntos'
import Historial from './pages/Historial'
import MisReportes from './pages/MisReportes'
import Impacto from './pages/Impacto'
import Regalos from './pages/Regalos'
import RegaloNuevo from './pages/RegaloNuevo'
import RegaloDetalle from './pages/RegaloDetalle'
import MisRegalos from './pages/MisRegalos'
import Mensajes from './pages/Mensajes'

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

        {/* AUTENTICACIÓN: ruta de layout para que /login y /register
            compartan la misma página y se anime el cambio entre ambas */}
        <Route element={<Autenticacion />}>
          <Route path="/login" element={null} />
          <Route path="/register" element={null} />
        </Route>

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

        {/* HISTORIAL */}
        <Route
          path="/historial"
          element={<Historial />}
        />

        {/* MIS REPORTES (con la respuesta del administrador) */}
        <Route
          path="/mis-reportes"
          element={<MisReportes />}
        />

        {/* IMPACTO */}
        <Route
          path="/impacto"
          element={<Impacto />}
        />

        {/* REGALOS (marketplace gratuito) Y SU CHAT */}
        <Route
          path="/regalos"
          element={<Regalos />}
        />

        <Route
          path="/regalos/nuevo"
          element={<RegaloNuevo />}
        />

        <Route
          path="/regalos/:id"
          element={<RegaloDetalle />}
        />

        <Route
          path="/mis-regalos"
          element={<MisRegalos />}
        />

        <Route
          path="/mensajes"
          element={<Mensajes />}
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

// El chat (Socket.IO) vive en un contexto para toda la aplicación:
// así el contador de no leídos de la barra se actualiza en cualquier página
function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  )
}

export default App
