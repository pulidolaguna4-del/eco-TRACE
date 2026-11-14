// =========================================================
// INICIO DE SESIÓN Y REGISTRO
// =========================================================
// Una sola página para /login y /register (ruta de layout en App.jsx),
// así no se desmonta al cambiar de ruta y los paneles se pueden animar:
//   /login    -> foto a la izquierda, formulario a la derecha
//   /register -> formulario a la izquierda, foto a la derecha
// Al cambiar, los dos paneles se deslizan e intercambian su lugar
// (animación "layout" de framer-motion) y la foto cambia.

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import { useTheme } from '../context/ThemeContext'
import { CONTENIDO } from '../components/auth/contenido'
import PanelFoto from '../components/auth/PanelFoto'
import FormularioLogin from '../components/auth/FormularioLogin'
import FormularioRegistro from '../components/auth/FormularioRegistro'
import Logo from '../components/Logo'

const DESLIZAMIENTO = { type: 'spring', stiffness: 60, damping: 17, mass: 0.9 }

function Autenticacion() {
  const location = useLocation()
  const { tema, alternarTema } = useTheme()
  const prefiereReducido = useReducedMotion()

  const modo = location.pathname === '/register' ? 'registro' : 'login'
  const esRegistro = modo === 'registro'

  const [impacto, setImpacto] = useState(null)

  // Cifras reales para las tarjetas de la foto (si falla, se ocultan)
  useEffect(() => {
    const controlador = new AbortController()

    fetch(`${API_URL}/impacto`, { signal: controlador.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => datos && setImpacto(datos))
      .catch(() => {})

    return () => controlador.abort()
  }, [])

  useEffect(() => {
    document.title = esRegistro ? 'Crear cuenta · eco-TRACE' : 'Iniciar sesión · eco-TRACE'
  }, [esRegistro])

  const transicion = prefiereReducido ? { duration: 0 } : DESLIZAMIENTO

  return (
    <div
      className={`min-h-screen flex overflow-x-hidden bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] transition-colors duration-300 font-sans ${
        esRegistro ? 'lg:flex-row-reverse' : 'lg:flex-row'
      }`}
    >
      {/* PANEL DE LA FOTO (pantallas grandes) */}
      <motion.aside
        layout="position"
        transition={transicion}
        className="hidden lg:block lg:w-1/2 xl:w-[55%] min-h-screen relative z-10 shadow-2xl"
      >
        <div className="sticky top-0 h-screen">
          <PanelFoto modo={modo} impacto={impacto} />
        </div>
      </motion.aside>

      {/* PANEL DEL FORMULARIO */}
      <motion.main
        layout="position"
        transition={transicion}
        className="flex-1 flex flex-col min-h-screen"
      >
        {/* FOTO EN PANTALLAS PEQUEÑAS */}
        <div className="relative h-44 sm:h-56 lg:hidden overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.img
              key={modo}
              src={CONTENIDO[modo].foto}
              alt={CONTENIDO[modo].altFoto}
              initial={prefiereReducido ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full object-cover object-[55%_35%]"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f14]/90 via-[#0f2a1b]/40 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-4 left-5 text-white">
            <Logo className="h-7 w-auto" />
            <p className="text-xs text-white/80 font-semibold mt-1.5">📍 Ciudad Bolívar, Bogotá</p>
          </div>
        </div>

        {/* BARRA SUPERIOR */}
        <div className="flex items-center justify-between gap-3 px-6 sm:px-10 pt-6">
          <Link
            to="/home"
            className="hidden lg:inline-flex items-center text-[#218739] dark:text-[#2fa350]"
          >
            <Logo className="h-6 w-auto" titulo="eco-TRACE, ir al inicio" />
          </Link>

          <div className="flex items-center gap-3 ml-auto">
            <Link
              to="/home"
              className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae] hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors"
            >
              ← Volver al inicio
            </Link>
            <button
              type="button"
              onClick={alternarTema}
              className="p-2 rounded-xl bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/40 text-base cursor-pointer hover:scale-105 transition-transform"
              title={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              aria-label={tema === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            >
              {tema === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        {/* FORMULARIO: se funde al cambiar de modo mientras el panel se desliza */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={modo}
                initial={prefiereReducido ? false : { opacity: 0, x: esRegistro ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefiereReducido ? { opacity: 0 } : { opacity: 0, x: esRegistro ? 30 : -30 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {esRegistro ? <FormularioRegistro /> : <FormularioLogin />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.main>
    </div>
  )
}

export default Autenticacion
