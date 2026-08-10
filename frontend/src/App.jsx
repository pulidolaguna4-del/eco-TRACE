import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Mapa from './pages/Mapa'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/mapa"
        element={<Mapa />}
      />

      <Route
        path="/admin"
        element={<Admin />}
      />


      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

      

    </Routes>
  )
}

export default App

