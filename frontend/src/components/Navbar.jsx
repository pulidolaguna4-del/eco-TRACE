import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

function Navbar() {
  const navigate = useNavigate()
  const { tema, alternarTema } = useTheme()

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const token = localStorage.getItem('access_token')

  const prefiereReducido = useReducedMotion()

  const cerrarSesion = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#1a2320]/95 backdrop-blur-md shadow-xs border-b border-gray-100 dark:border-gray-800/40 sticky top-0 z-50 transition-colors duration-300">

      {/* Logo / nombre */}
      <div className="flex items-center">
        <Link
          to="/home"
          className="text-lg font-black tracking-wider text-[#218739] dark:text-[#2fa350] hover:text-[#176b2b] dark:hover:text-[#4caf68] flex items-center gap-1.5 transition-colors duration-150"
        >
          <span>🌱</span> eco-TRACE
        </Link>
      </div>

      {/* Menú principal */}
      <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600 dark:text-[#a8b3ae]">
        <Link to="/home" className="hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors duration-150">Inicio</Link>
        <Link to="/mapa" className="hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors duration-150">Mapa</Link>
        <Link to="/agregar-punto" className="hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors duration-150">Agregar punto</Link>
        <Link to="/mis-puntos" className="hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors duration-150">Mis puntos</Link>
        <Link to="/perfil" className="hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors duration-150">Mi perfil</Link>

        {/* Solo aparece si el usuario es administrador */}
        {usuario?.es_admin && (
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 font-extrabold flex items-center gap-1 transition-all duration-150"
          >
            👑 Administración
          </Link>
        )}
      </div>

      {/* Parte derecha con Alternador de Tema */}
      <div className="flex items-center gap-4 text-sm">
        {/* BOTÓN INTERACTIVO DE CAMBIO DE TEMA */}
        <motion.button
          type="button"
          onClick={alternarTema}
          whileHover={prefiereReducido ? {} : { scale: 1.1, rotate: 10 }}
          whileTap={prefiereReducido ? {} : { scale: 0.9 }}
          className="p-2 rounded-xl bg-gray-100 dark:bg-[#1a2320] text-gray-600 dark:text-[#a8b3ae] hover:bg-gray-200 dark:hover:bg-gray-800/40 border border-transparent dark:border-gray-800/30 cursor-pointer focus:outline-hidden transition-colors duration-300"
          title={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {tema === 'light' ? (
              <motion.span
                key="moon"
                initial={{ opacity: 0, rotate: -40, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 40, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="block text-base"
              >
                🌙
              </motion.span>
            ) : (
              <motion.span
                key="sun"
                initial={{ opacity: 0, rotate: 40, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -40, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="block text-base"
              >
                ☀️
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {token && usuario ? (
          <>
            <span className="hidden sm:inline-flex items-center gap-1 font-bold text-gray-700 dark:text-[#f2f5f3]">
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
            className="px-4 py-2 text-xs font-bold text-[#218739] dark:text-[#2fa350] hover:text-[#176b2b] border border-[#218739]/20 hover:border-[#176b2b]/30 rounded-lg transition-all duration-150"
          >
            Iniciar sesión
          </Link>
        )}
      </div>

    </nav>
  )
}

export default Navbar
