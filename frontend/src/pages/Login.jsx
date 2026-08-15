import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

function Login() {
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [esError, setEsError] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [intentosErroneos, setIntentosErroneos] = useState(0)

  const prefiereReducido = useReducedMotion()

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
      const respuesta = await fetch('http://127.0.0.1:8000/usuarios/login', {
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
      const respuestaUsuario = await fetch('http://127.0.0.1:8000/usuarios/me', {
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
      // GUARDAR USUARIO
      // =====================================================
      localStorage.setItem('usuario', JSON.stringify(usuario))
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

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] p-4 sm:p-6 lg:p-8 transition-colors duration-300 overflow-hidden font-sans">

      {/* FONDO CON DETALLE DECORATIVO ORGÁNICO */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Blob superior verde */}
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-[#218739]/10 dark:bg-[#2fa350]/10 blur-3xl"></div>
        {/* Blob inferior derecho */}
        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-emerald-600/10 dark:bg-emerald-400/10 blur-3xl"></div>

        {/* Patrón orgánico SVG sutil */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30 dark:opacity-10 text-[#218739]/20 stroke-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <pattern id="grid-eco" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" strokeWidth="0.8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-eco)" />
        </svg>
      </div>

      {/* TARJETA DE LOGIN */}
      <motion.div
        initial={{ opacity: 0, y: prefiereReducido ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          key={intentosErroneos}
          variants={shakeVariantes}
          animate={intentosErroneos > 0 ? 'shake' : 'normal'}
          className="bg-white/90 dark:bg-[#1a2320]/90 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100 dark:border-gray-800/40 transition-colors duration-300"
        >
          {/* LOGO Y ENCABEZADO */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: prefiereReducido ? 1 : 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#f1f8f4] dark:bg-[#121816] text-2xl mb-4 border border-[#218739]/10 dark:border-gray-800"
            >
              🌱
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
              eco-TRACE
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] font-medium mt-1">
              Conecta, recicla y transforma tu ciudad
            </p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* CAMPO: CORREO */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2"
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                placeholder="Ingresa tu correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] focus:ring-2 focus:ring-[#218739]/20 dark:focus:ring-[#2fa350]/20 transition-all duration-150"
              />
            </div>

            {/* CAMPO: CONTRASEÑA */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] focus:ring-2 focus:ring-[#218739]/20 dark:focus:ring-[#2fa350]/20 transition-all duration-150"
              />
            </div>

            {/* ENLACE RECUPERAR CONTRASEÑA */}
            <div className="flex justify-end">
              <Link
                to="/recuperar-password"
                className="text-xs font-semibold text-[#218739] dark:text-[#2fa350] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* BOTÓN CON ESTADO DE CARGA ANIMADO */}
            <motion.button
              type="submit"
              disabled={cargando}
              whileHover={prefiereReducido || cargando ? {} : { scale: 1.02 }}
              whileTap={prefiereReducido || cargando ? {} : { scale: 0.98 }}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#218739] to-[#39aa53] dark:from-[#2fa350] dark:to-[#39aa53] hover:from-[#176b2b] hover:to-[#2b833e] disabled:opacity-75 disabled:cursor-not-allowed shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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

          {/* MENSAJES DE ERROR O ÉXITO CON TRANSICIÓN SUAVE */}
          <AnimatePresence mode="wait">
            {mensaje && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.25 }}
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

          {/* ENLACE REGISTRO */}
          <div className="mt-8 text-center text-xs text-gray-500 dark:text-[#a8b3ae]">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="font-bold text-[#218739] dark:text-[#2fa350] hover:underline"
              >
                Crear cuenta
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login
