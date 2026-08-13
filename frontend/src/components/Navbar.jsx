import { Link, useNavigate } from 'react-router-dom'

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
    <nav className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100 sticky top-0 z-50 transition-all duration-200">

      {/* Logo / nombre */}
      <div className="flex items-center">
        <Link
          to="/home"
          className="text-lg font-black tracking-wider text-[#218739] hover:text-[#176b2b] flex items-center gap-1.5 transition-colors duration-150"
        >
          <span>🌱</span> eco-TRACE
        </Link>
      </div>

      {/* Menú principal */}
      <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
        <Link to="/home" className="hover:text-[#218739] transition-colors duration-150">Inicio</Link>

        <Link to="/mapa" className="hover:text-[#218739] transition-colors duration-150">Mapa</Link>

        <Link to="/agregar-punto" className="hover:text-[#218739] transition-colors duration-150">Agregar punto</Link>

        <Link to="/mis-puntos" className="hover:text-[#218739] transition-colors duration-150">Mis puntos</Link>

        <Link to="/perfil" className="hover:text-[#218739] transition-colors duration-150">Mi perfil</Link>

        {/* Solo aparece si el usuario es administrador */}
        {usuario?.es_admin && (
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-extrabold flex items-center gap-1 transition-all duration-150"
          >
            👑 Administración
          </Link>
        )}
      </div>

      {/* Parte derecha */}
      <div className="flex items-center gap-4 text-sm">
        {token && usuario ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1 font-bold text-gray-700">
              👤 {usuario.nombre}
            </span>

            <button
              onClick={cerrarSesion}
              className="px-4 py-2 text-xs font-bold text-white bg-[#218739] hover:bg-[#176b2b] rounded-lg cursor-pointer transition-colors duration-150"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-bold text-[#218739] hover:text-[#176b2b] border border-[#218739]/20 hover:border-[#176b2b]/30 rounded-lg transition-all duration-150"
          >
            Iniciar sesión
          </Link>
        )}
      </div>

    </nav>
  )
}

export default Navbar
