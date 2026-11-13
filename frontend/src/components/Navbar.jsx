// =========================================================
// BARRA DE NAVEGACIÓN
// =========================================================
// - Fija arriba. En el inicio es transparente sobre la foto del hero y
//   se vuelve sólida al bajar; en las demás páginas siempre es sólida
//   (y deja un espacio de su altura para no tapar el contenido).
// - Enlaces principales: Inicio, Mapa, Impacto. Lo personal (perfil,
//   mis puntos, mis entregas, administración) va en el menú de usuario.
// - En pantallas pequeñas, un botón abre el menú completo.

import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { useTheme } from '../context/ThemeContext'
import Logo from './Logo'

const ENLACES = [
  { to: '/home', texto: 'Inicio', icono: '🏠' },
  { to: '/mapa', texto: 'Mapa', icono: '🗺️' },
  { to: '/impacto', texto: 'Impacto', icono: '📊' }
]

const ENLACES_USUARIO = [
  { to: '/perfil', texto: 'Mi perfil', icono: '👤' },
  { to: '/mis-puntos', texto: 'Mis puntos', icono: '📍' },
  { to: '/historial', texto: 'Mis entregas', icono: '♻️' },
  { to: '/mis-reportes', texto: 'Mis reportes', icono: '🚩' }
]

function leerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch {
    return null
  }
}

function esRutaActiva(pathname, to) {
  if (to === '/home') return pathname === '/' || pathname === '/home'
  return pathname === to
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tema, alternarTema } = useTheme()
  const prefiereReducido = useReducedMotion()

  const usuario = leerUsuario()
  const sesionActiva = Boolean(localStorage.getItem('access_token') && usuario)

  const esInicio = location.pathname === '/' || location.pathname === '/home'

  const [conScroll, setConScroll] = useState(false)
  const [menuUsuario, setMenuUsuario] = useState(false)
  const [menuMovil, setMenuMovil] = useState(false)
  const refMenuUsuario = useRef(null)

  // Solidificar la barra al bajar
  useEffect(() => {
    const alDesplazar = () => setConScroll(window.scrollY > 40)
    alDesplazar()
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => window.removeEventListener('scroll', alDesplazar)
  }, [])

  // Cerrar los menús al cambiar de página
  useEffect(() => {
    setMenuUsuario(false)
    setMenuMovil(false)
  }, [location.pathname])

  // Cerrar el menú de usuario con clic afuera o Escape
  useEffect(() => {
    if (!menuUsuario) return

    const alHacerClic = (e) => {
      if (refMenuUsuario.current && !refMenuUsuario.current.contains(e.target)) {
        setMenuUsuario(false)
      }
    }
    const alPresionar = (e) => e.key === 'Escape' && setMenuUsuario(false)

    document.addEventListener('mousedown', alHacerClic)
    document.addEventListener('keydown', alPresionar)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      document.removeEventListener('keydown', alPresionar)
    }
  }, [menuUsuario])

  const cerrarSesion = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario')
    setMenuUsuario(false)
    setMenuMovil(false)
    navigate('/login')
  }

  // Transparente solo en el inicio, arriba del todo y con el menú cerrado
  const transparente = esInicio && !conScroll && !menuMovil

  const inicial = usuario?.nombre?.trim()?.charAt(0)?.toUpperCase() || '?'

  const colorTexto = transparente
    ? 'text-white/85 hover:text-white'
    : 'text-gray-600 dark:text-[#a8b3ae] hover:text-[#218739] dark:hover:text-[#2fa350]'

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-[1100] h-16 transition-[background-color,box-shadow,border-color] duration-300 ${
          transparente
            ? 'bg-transparent border-b border-transparent'
            : 'bg-white/85 dark:bg-[#0f1512]/85 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 shadow-xs'
        }`}
        aria-label="Principal"
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

          {/* LOGO */}
          <Link
            to="/home"
            className={`flex items-center shrink-0 transition-colors ${
              transparente ? 'text-white' : 'text-[#218739] dark:text-[#2fa350]'
            }`}
          >
            <Logo className="h-7 w-auto" titulo="eco-TRACE, ir al inicio" />
          </Link>

          {/* ENLACES PRINCIPALES (escritorio) */}
          <div className="hidden md:flex items-center gap-1">
            {ENLACES.map((enlace) => {
              const activo = esRutaActiva(location.pathname, enlace.to)

              return (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  className={`relative px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    activo
                      ? transparente
                        ? 'text-white'
                        : 'text-[#218739] dark:text-[#2fa350]'
                      : colorTexto
                  }`}
                >
                  {activo && (
                    <motion.span
                      layoutId="enlace-activo"
                      transition={prefiereReducido ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 30 }}
                      className={`absolute inset-0 rounded-full ${
                        transparente
                          ? 'bg-white/15 border border-white/25'
                          : 'bg-[#218739]/10 dark:bg-[#2fa350]/15'
                      }`}
                    />
                  )}
                  <span className="relative">{enlace.texto}</span>
                </NavLink>
              )
            })}
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-2">
            {/* TEMA */}
            <button
              type="button"
              onClick={alternarTema}
              className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                transparente
                  ? 'bg-white/15 hover:bg-white/25 border border-white/25'
                  : 'bg-gray-100 dark:bg-[#1a2320] hover:bg-gray-200 dark:hover:bg-gray-800/60 border border-transparent dark:border-gray-800/40'
              }`}
              title={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              aria-label={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={tema}
                  initial={prefiereReducido ? false : { opacity: 0, rotate: -40, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={prefiereReducido ? { opacity: 0 } : { opacity: 0, rotate: 40, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="block text-base"
                >
                  {tema === 'light' ? '🌙' : '☀️'}
                </motion.span>
              </AnimatePresence>
            </button>

            {/* SESIÓN (escritorio) */}
            {sesionActiva ? (
              <div className="relative hidden md:block" ref={refMenuUsuario}>
                <button
                  type="button"
                  onClick={() => setMenuUsuario((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuUsuario}
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-bold cursor-pointer transition-colors ${
                    transparente
                      ? 'text-white bg-white/15 hover:bg-white/25 border border-white/25'
                      : 'text-gray-800 dark:text-[#f2f5f3] bg-gray-100 dark:bg-[#1a2320] hover:bg-gray-200 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span className="relative w-7 h-7 rounded-full bg-gradient-to-br from-[#218739] to-[#4caf68] text-white flex items-center justify-center text-xs font-black">
                    {inicial}
                    {usuario?.es_admin && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#1a2320]" title="Administrador" />
                    )}
                  </span>
                  <span className="max-w-[8rem] truncate">{usuario?.nombre}</span>
                  <motion.span
                    animate={{ rotate: menuUsuario ? 180 : 0 }}
                    transition={{ duration: prefiereReducido ? 0 : 0.2 }}
                    className="text-[10px] opacity-70"
                    aria-hidden="true"
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence>
                  {menuUsuario && (
                    <motion.div
                      initial={prefiereReducido ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={prefiereReducido ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      role="menu"
                      className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/60 shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/60">
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{usuario?.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] truncate">{usuario?.correo}</p>
                        {usuario?.es_admin && (
                          <span className="inline-flex mt-2 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 text-[10px] font-extrabold uppercase tracking-wider">
                            👑 Administrador
                          </span>
                        )}
                      </div>

                      <div className="p-1.5">
                        {ENLACES_USUARIO.map((enlace) => (
                          <Link
                            key={enlace.to}
                            to={enlace.to}
                            role="menuitem"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                              esRutaActiva(location.pathname, enlace.to)
                                ? 'bg-[#218739]/10 dark:bg-[#2fa350]/15 text-[#218739] dark:text-[#2fa350]'
                                : 'text-gray-700 dark:text-[#dce4e0] hover:bg-gray-50 dark:hover:bg-gray-800/40'
                            }`}
                          >
                            <span aria-hidden="true">{enlace.icono}</span>
                            {enlace.texto}
                          </Link>
                        ))}

                        {usuario?.es_admin && (
                          <Link
                            to="/admin"
                            role="menuitem"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          >
                            <span aria-hidden="true">👑</span>
                            Administración
                          </Link>
                        )}
                      </div>

                      <div className="p-1.5 border-t border-gray-100 dark:border-gray-800/60">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={cerrarSesion}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#d93025] dark:text-[#ef5350] hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                        >
                          <span aria-hidden="true">↩️</span>
                          Cerrar sesión
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${colorTexto}`}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    transparente
                      ? 'bg-white text-[#176b2b] hover:bg-white/90'
                      : 'bg-[#218739] hover:bg-[#176b2b] text-white'
                  }`}
                >
                  Crear cuenta
                </Link>
              </div>
            )}

            {/* BOTÓN MENÚ (móvil) */}
            <button
              type="button"
              onClick={() => setMenuMovil((v) => !v)}
              aria-expanded={menuMovil}
              aria-controls="menu-movil"
              aria-label={menuMovil ? 'Cerrar menú' : 'Abrir menú'}
              className={`md:hidden w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                transparente
                  ? 'bg-white/15 border border-white/25'
                  : 'bg-gray-100 dark:bg-[#1a2320] border border-transparent dark:border-gray-800/40'
              }`}
            >
              {[0, 1, 2].map((n) => (
                <motion.span
                  key={n}
                  animate={
                    menuMovil
                      ? n === 0 ? { rotate: 45, y: 7 } : n === 1 ? { opacity: 0 } : { rotate: -45, y: -7 }
                      : { rotate: 0, y: 0, opacity: 1 }
                  }
                  transition={{ duration: prefiereReducido ? 0 : 0.2 }}
                  className={`block w-5 h-0.5 rounded-full ${transparente ? 'bg-white' : 'bg-gray-700 dark:bg-[#dce4e0]'}`}
                />
              ))}
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL */}
        <AnimatePresence>
          {menuMovil && (
            <motion.div
              id="menu-movil"
              initial={prefiereReducido ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={prefiereReducido ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden overflow-hidden bg-white dark:bg-[#0f1512] border-b border-gray-100 dark:border-gray-800/60 shadow-xl"
            >
              <div className="px-4 py-4 space-y-1">
                {ENLACES.map((enlace) => (
                  <Link
                    key={enlace.to}
                    to={enlace.to}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold ${
                      esRutaActiva(location.pathname, enlace.to)
                        ? 'bg-[#218739]/10 dark:bg-[#2fa350]/15 text-[#218739] dark:text-[#2fa350]'
                        : 'text-gray-700 dark:text-[#dce4e0]'
                    }`}
                  >
                    <span aria-hidden="true">{enlace.icono}</span>
                    {enlace.texto}
                  </Link>
                ))}

                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800/60">
                  {sesionActiva ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2">
                        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#218739] to-[#4caf68] text-white flex items-center justify-center text-sm font-black">
                          {inicial}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{usuario?.nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-[#a8b3ae] truncate">{usuario?.correo}</p>
                        </div>
                      </div>

                      {ENLACES_USUARIO.map((enlace) => (
                        <Link
                          key={enlace.to}
                          to={enlace.to}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold ${
                            esRutaActiva(location.pathname, enlace.to)
                              ? 'bg-[#218739]/10 dark:bg-[#2fa350]/15 text-[#218739] dark:text-[#2fa350]'
                              : 'text-gray-700 dark:text-[#dce4e0]'
                          }`}
                        >
                          <span aria-hidden="true">{enlace.icono}</span>
                          {enlace.texto}
                        </Link>
                      ))}

                      {usuario?.es_admin && (
                        <Link to="/admin" className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-400">
                          <span aria-hidden="true">👑</span>
                          Administración
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={cerrarSesion}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[#d93025] dark:text-[#ef5350] cursor-pointer"
                      >
                        <span aria-hidden="true">↩️</span>
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/login"
                        className="py-3 rounded-xl text-center text-sm font-bold text-gray-700 dark:text-[#dce4e0] bg-gray-100 dark:bg-[#1a2320]"
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        to="/register"
                        className="py-3 rounded-xl text-center text-sm font-bold text-white bg-[#218739]"
                      >
                        Crear cuenta
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Espacio de la barra fija (en el inicio el hero va debajo de ella) */}
      {!esInicio && <div className="h-16" aria-hidden="true" />}
    </>
  )
}

export default Navbar
