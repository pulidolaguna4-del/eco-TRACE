import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import { useTheme } from '../context/ThemeContext'
import fotoCiudadBolivar from '../assets/ciudad-bolivar-transmicable.jpg'

// Foto: "Bogota (52428171603).jpg", Mussi Katz, Wikimedia Commons, CC0

const CLAVE_CORREO_RECORDADO = 'correo_recordado'

// Mensajes que rotan sobre la foto
const MENSAJES = [
  {
    titulo: 'Tu localidad, más verde',
    texto: 'Encuentra puntos de reciclaje, donación de ropa y residuos electrónicos verificados por la comunidad de Ciudad Bolívar.'
  },
  {
    titulo: 'Cada entrega cuenta',
    texto: 'Registra lo que reciclas o donas y mira en el dashboard de impacto cuántos kilos llevamos entre todos.'
  },
  {
    titulo: 'Propón nuevos puntos',
    texto: 'Marca un punto con tu ubicación o una dirección. Un administrador lo revisa antes de publicarlo en el mapa.'
  }
]

function leerCorreoRecordado() {
  try {
    return localStorage.getItem(CLAVE_CORREO_RECORDADO) || ''
  } catch {
    return ''
  }
}

const numero = (valor, decimales = 0) =>
  Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: decimales })

// =========================================================
// PANEL DE LA FOTO (IZQUIERDA)
// =========================================================

function PanelCiudad({ impacto }) {
  const prefiereReducido = useReducedMotion()
  const [indice, setIndice] = useState(0)

  // Rota los mensajes cada 6 s (no si el usuario prefiere menos movimiento)
  useEffect(() => {
    if (prefiereReducido) return
    const intervalo = setInterval(
      () => setIndice((actual) => (actual + 1) % MENSAJES.length),
      6000
    )
    return () => clearInterval(intervalo)
  }, [prefiereReducido])

  const mensaje = MENSAJES[indice]

  return (
    <aside className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between overflow-hidden p-10 xl:p-12 text-white">
      {/* FOTO + VELO VERDE */}
      <img
        src={fotoCiudadBolivar}
        alt="Cabinas del TransMiCable sobre las casas de colores de Ciudad Bolívar, Bogotá"
        className="absolute inset-0 w-full h-full object-cover object-[55%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f14] via-[#0b1f14]/60 to-[#0f1512]/10" aria-hidden="true" />
      <div className="absolute inset-0 bg-[#176b2b]/20 mix-blend-multiply" aria-hidden="true" />

      {/* Espacio arriba: deja ver las cabinas del TransMiCable */}
      <div className="h-24 xl:h-32" aria-hidden="true" />

      {/* TARJETAS FLOTANTES */}
      <div className="relative flex justify-center py-8">
        <motion.div
          initial={prefiereReducido ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative w-full max-w-sm"
        >
          <div className="rounded-3xl bg-white/95 dark:bg-[#1a2320]/95 backdrop-blur-md text-gray-900 dark:text-[#f2f5f3] p-6 shadow-2xl">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#218739] dark:text-[#2fa350]">
              Mapa comunitario
            </p>
            <h2 className="text-2xl font-black leading-tight mt-1">
              Recicla cerca
              <br />
              de tu casa
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-2 leading-relaxed">
              {impacto
                ? `${numero(impacto.puntos_activos)} puntos ecológicos verificados te esperan en el mapa.`
                : 'Puntos ecológicos verificados por tus vecinos, en un solo mapa.'}
            </p>
            <Link
              to="/mapa"
              className="inline-flex mt-4 px-4 py-2 rounded-full bg-[#176b2b] hover:bg-[#218739] text-white text-xs font-bold transition-colors"
            >
              Ver el mapa
            </Link>
          </div>

          {impacto && (
            <motion.div
              initial={prefiereReducido ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="absolute -bottom-8 -right-6 xl:-right-10 rounded-2xl bg-white dark:bg-[#1a2320] text-gray-900 dark:text-[#f2f5f3] px-5 py-4 shadow-2xl border border-gray-100 dark:border-gray-800/40"
            >
              <p className="text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae] flex items-center gap-1.5">
                ♻️ Kilos reciclados
              </p>
              <p className="text-2xl font-black tabular-nums">
                {numero(impacto.kg_reciclados, 1)}
                <span className="text-sm font-bold text-gray-400 ml-1">kg</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* MENSAJES QUE ROTAN */}
      <div className="relative text-center max-w-md mx-auto">
        <span className="inline-flex mb-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold">
          📍 Ciudad Bolívar, Bogotá
        </span>

        <div className="min-h-[7.5rem]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={indice}
              initial={prefiereReducido ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefiereReducido ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-3xl xl:text-4xl font-black tracking-tight">
                {mensaje.titulo}
              </h2>
              <p className="text-sm text-white/80 mt-3 leading-relaxed">
                {mensaje.texto}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2 mt-6" role="group" aria-label="Mensajes">
          {MENSAJES.map((m, n) => (
            <button
              key={m.titulo}
              type="button"
              onClick={() => setIndice(n)}
              aria-label={`Ver mensaje ${n + 1}: ${m.titulo}`}
              aria-current={n === indice}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                n === indice ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        <p className="text-[10px] text-white/50 mt-6">
          Foto: Mussi Katz · Wikimedia Commons (CC0)
        </p>
      </div>
    </aside>
  )
}

// =========================================================
// LOGIN
// =========================================================

function Login() {
  const navigate = useNavigate()
  const { tema, alternarTema } = useTheme()

  const [correo, setCorreo] = useState(leerCorreoRecordado)
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [recordar, setRecordar] = useState(() => leerCorreoRecordado() !== '')
  const [mensaje, setMensaje] = useState('')
  const [esError, setEsError] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [intentosErroneos, setIntentosErroneos] = useState(0)
  const [impacto, setImpacto] = useState(null)

  const prefiereReducido = useReducedMotion()

  // Cifras reales para las tarjetas de la foto (si falla, se ocultan)
  useEffect(() => {
    const controlador = new AbortController()

    fetch(`${API_URL}/impacto`, { signal: controlador.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => datos && setImpacto(datos))
      .catch(() => {})

    return () => controlador.abort()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMensaje('')
    setEsError(false)

    // Validación de campos vacíos
    if (!correo.trim() || !password.trim()) {
      setMensaje('Por favor completa todos los campos')
      setEsError(true)
      setIntentosErroneos((prev) => prev + 1)
      return
    }

    setCargando(true)

    try {
      // =====================================================
      // LOGIN
      // =====================================================
      const respuesta = await fetch(`${API_URL}/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: correo,
          password: password
        })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setMensaje(datos.detail || 'Correo o contraseña incorrectos')
        setEsError(true)
        setIntentosErroneos((prev) => prev + 1)
        setCargando(false)
        return
      }

      // =====================================================
      // GUARDAR TOKEN
      // =====================================================
      localStorage.setItem('access_token', datos.access_token)

      // =====================================================
      // OBTENER USUARIO REAL
      // =====================================================
      const respuestaUsuario = await fetch(`${API_URL}/usuarios/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${datos.access_token}`
        }
      })

      const usuario = await respuestaUsuario.json()

      if (!respuestaUsuario.ok) {
        localStorage.removeItem('access_token')
        setMensaje(usuario.detail || 'No se pudo obtener la información del usuario')
        setEsError(true)
        setIntentosErroneos((prev) => prev + 1)
        setCargando(false)
        return
      }

      // =====================================================
      // GUARDAR USUARIO (Y EL CORREO SI PIDIÓ RECORDARLO)
      // =====================================================
      localStorage.setItem('usuario', JSON.stringify(usuario))

      try {
        if (recordar) localStorage.setItem(CLAVE_CORREO_RECORDADO, correo.trim())
        else localStorage.removeItem(CLAVE_CORREO_RECORDADO)
      } catch {
        // Sin almacenamiento disponible: no pasa nada
      }

      setMensaje('¡Inicio de sesión exitoso!')
      setEsError(false)

      // Ir al home
      navigate('/home')

    } catch (error) {
      console.error(error)
      setMensaje('No se pudo conectar con el servidor')
      setEsError(true)
      setIntentosErroneos((prev) => prev + 1)
    } finally {
      setCargando(false)
    }
  }

  // Variantes para la animación de sacudida (Shake) al fallar
  const shakeVariantes = {
    normal: { x: 0 },
    shake: {
      x: prefiereReducido ? 0 : [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.4, ease: 'easeInOut' }
    }
  }

  const claseCampo =
    'w-full px-4 py-3 text-sm rounded-xl bg-white dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] focus:ring-2 focus:ring-[#218739]/20 dark:focus:ring-[#2fa350]/20 transition-all duration-150'

  return (
    <div className="min-h-screen flex bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] transition-colors duration-300 font-sans">

      <PanelCiudad impacto={impacto} />

      {/* PANEL DEL FORMULARIO (DERECHA) */}
      <main className="flex-1 flex flex-col min-h-screen">

        {/* FOTO EN PANTALLAS PEQUEÑAS */}
        <div className="relative h-44 sm:h-56 lg:hidden overflow-hidden">
          <img
            src={fotoCiudadBolivar}
            alt="Cabinas del TransMiCable sobre las casas de colores de Ciudad Bolívar, Bogotá"
            className="absolute inset-0 w-full h-full object-cover object-[55%_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f14]/90 via-[#0f2a1b]/40 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-4 left-5 text-white">
            <p className="text-xl font-black tracking-wide flex items-center gap-2">🌱 eco-TRACE</p>
            <p className="text-xs text-white/80 font-semibold">📍 Ciudad Bolívar, Bogotá</p>
          </div>
        </div>

        {/* BARRA SUPERIOR */}
        <div className="flex items-center justify-end gap-3 px-6 sm:px-10 pt-6">
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

        {/* FORMULARIO */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10">
          <motion.div
            initial={{ opacity: 0, y: prefiereReducido ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <motion.div
              key={intentosErroneos}
              variants={shakeVariantes}
              animate={intentosErroneos > 0 ? 'shake' : 'normal'}
            >
              {/* ENCABEZADO */}
              <div className="mb-8">
                <span className="hidden lg:inline-flex items-center gap-2 text-sm font-black tracking-wide text-[#218739] dark:text-[#2fa350] mb-6">
                  🌱 eco-TRACE
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                  Iniciar sesión
                </h1>
                <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-2">
                  ¿No tienes una cuenta?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-[#218739] dark:text-[#2fa350] underline underline-offset-2 hover:text-[#176b2b]"
                  >
                    Crear cuenta
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* CORREO */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-gray-600 dark:text-[#a8b3ae] mb-2"
                  >
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    autoComplete="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    className={claseCampo}
                  />
                </div>

                {/* CONTRASEÑA CON BOTÓN VER / OCULTAR */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-gray-600 dark:text-[#a8b3ae] mb-2"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${claseCampo} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((v) => !v)}
                      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={mostrarPassword}
                      className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-[#218739] dark:hover:text-[#2fa350] cursor-pointer"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        {mostrarPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <path d="M1 1l22 22" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* RECORDARME / OLVIDÉ MI CONTRASEÑA */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-[#a8b3ae] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={recordar}
                      onChange={(e) => setRecordar(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-[#218739] cursor-pointer"
                    />
                    Recordar mi correo
                  </label>

                  <Link
                    to="/recuperar-password"
                    className="text-xs font-bold text-[#218739] dark:text-[#2fa350] underline underline-offset-2 hover:text-[#176b2b]"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* BOTÓN CON ESTADO DE CARGA */}
                <motion.button
                  type="submit"
                  disabled={cargando}
                  whileHover={prefiereReducido || cargando ? {} : { scale: 1.01 }}
                  whileTap={prefiereReducido || cargando ? {} : { scale: 0.99 }}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#176b2b] hover:bg-[#218739] dark:bg-[#218739] dark:hover:bg-[#2fa350] disabled:opacity-75 disabled:cursor-not-allowed shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AnimatePresence mode="wait">
                    {cargando ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Iniciando sesión...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="normal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Iniciar sesión
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>

              {/* MENSAJES DE ERROR O ÉXITO */}
              <AnimatePresence mode="wait">
                {mensaje && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.25 }}
                    role={esError ? 'alert' : 'status'}
                    className={`mt-5 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      esError
                        ? 'bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] border border-red-100 dark:border-red-900/30'
                        : 'bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border border-green-100 dark:border-green-900/30'
                    }`}
                  >
                    <span>{esError ? '⚠️' : '🎉'}</span>
                    <span>{mensaje}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SEPARADOR */}
              <div className="flex items-center gap-4 my-7" aria-hidden="true">
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">o</span>
                <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              </div>

              {/* ENTRAR SIN CUENTA */}
              <div className="space-y-3">
                <Link
                  to="/mapa"
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-700 dark:text-[#f2f5f3] bg-white dark:bg-[#1a2320] border border-gray-200 dark:border-gray-800 hover:border-[#218739]/50 dark:hover:border-[#2fa350]/50 transition-colors flex items-center justify-center gap-2"
                >
                  <span aria-hidden="true">🗺️</span>
                  Explorar el mapa sin cuenta
                </Link>
                <Link
                  to="/impacto"
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-700 dark:text-[#f2f5f3] bg-white dark:bg-[#1a2320] border border-gray-200 dark:border-gray-800 hover:border-[#218739]/50 dark:hover:border-[#2fa350]/50 transition-colors flex items-center justify-center gap-2"
                >
                  <span aria-hidden="true">📊</span>
                  Ver el impacto de la comunidad
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default Login
