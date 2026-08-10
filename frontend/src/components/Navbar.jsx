import { Link, useNavigate } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const token = localStorage.getItem('access_token')

  const cerrarSesion = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')

    navigate('/login')
  }

  return (
    <nav className="navbar">

      {/* Logo / nombre */}
      <div className="navbar-logo">
        <Link to="/home">
          🌱 eco-TRACE
        </Link>
      </div>

      {/* Menú principal */}
      <div className="navbar-menu">
        <Link to="/home">Inicio</Link>

        <Link to="/mapa">Mapa</Link>

        <Link to="/agregar-punto">Agregar punto</Link>

        <Link to="/mis-puntos">Mis puntos</Link>

        <Link to="/perfil">Mi perfil</Link>

        {/* Solo aparece si el usuario es administrador */}
        {usuario?.es_admin && (
          <Link to="/admin" className="navbar-admin">
            👑 Administración
          </Link>
        )}
      </div>

      {/* Parte derecha */}
      <div className="navbar-user">
        {token && usuario ? (
          <>
            <span className="navbar-welcome">
              👤 {usuario.nombre}
            </span>

            <button
              className="navbar-logout"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-login">
            Iniciar sesión
          </Link>
        )}
      </div>

    </nav>
  )
}

export default Navbar

