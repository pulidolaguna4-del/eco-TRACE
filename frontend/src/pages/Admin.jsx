import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

// =========================================================
// COMPONENTE DE CONTEO ANIMADO DE NÚMEROS (CountUp)
// =========================================================
function ContadorAnimado({ valor, duracion = 1 }) {
  const [conteo, setConteo] = useState(0)
  const inicioRef = useRef(null)
  const prefiereReducido = useReducedMotion()

  useEffect(() => {
    if (prefiereReducido) {
      setConteo(valor)
      return
    }

    let idAnimacion
    const inicio = conteo // Empezar desde el conteo actual

    const animar = (marcaTiempo) => {
      if (!inicioRef.current) inicioRef.current = marcaTiempo
      const progreso = marcaTiempo - inicioRef.current
      const fraccion = Math.min(progreso / (duracion * 1000), 1)

      // Función de easing out cuadratica
      const easingOut = 1 - (1 - fraccion) * (1 - fraccion)
      const valorActual = Math.floor(inicio + (valor - inicio) * easingOut)

      setConteo(valorActual)

      if (fraccion < 1) {
        idAnimacion = requestAnimationFrame(animar)
      }
    }

    idAnimacion = requestAnimationFrame(animar)
    return () => {
      cancelAnimationFrame(idAnimacion)
      inicioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, duracion, prefiereReducido])

  return <span>{conteo}</span>
}

function Admin() {
  const [puntosPendientes, setPuntosPendientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [puntosAprobados, setPuntosAprobados] = useState([])

  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null)
  const [pestañaActiva, setPestañaActiva] = useState('resumen') // 'resumen' o 'pendientes'

  const prefiereReducido = useReducedMotion()

  const cargarDatosDashboard = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Debes iniciar sesión como administrador')
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')
      setMensaje('')

      // 1. Obtener puntos pendientes
      const resPendientes = await fetch(
        'http://127.0.0.1:8000/admin/puntos/pendientes',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!resPendientes.ok) {
        if (resPendientes.status === 401) {
          setError('Debes iniciar sesión')
          return
        }
        if (resPendientes.status === 403) {
          setError('Debes iniciar sesión como administrador')
          return
        }
        throw new Error('Error al cargar puntos pendientes')
      }
      const datosPendientes = await resPendientes.json()
      setPuntosPendientes(datosPendientes)

      // 2. Obtener usuarios (para la métrica de usuarios registrados)
      const resUsuarios = await fetch(
        'http://127.0.0.1:8000/usuarios',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (resUsuarios.ok) {
        const datosUsuarios = await resUsuarios.json()
        setUsuarios(datosUsuarios)
      }

      // 3. Obtener puntos aprobados (para la métrica)
      const resAprobados = await fetch(
        'http://127.0.0.1:8000/puntos'
      )
      if (resAprobados.ok) {
        const datosAprobados = await resAprobados.json()
        setPuntosAprobados(datosAprobados)
      }

    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatosDashboard()
  }, [])

  const cambiarEstado = async (puntoId, accion) => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Tu sesión ha expirado')
      return
    }

    try {
      setProcesando(puntoId)
      setError('')
      setMensaje('')

      const respuesta = await fetch(
        `http://127.0.0.1:8000/admin/puntos/${puntoId}/${accion}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || 'No se pudo actualizar el estado del punto'
        )
      }

      if (accion === 'aprobar') {
        setMensaje('Punto aprobado correctamente')
        if (datos) {
          setPuntosAprobados((prev) => [...prev, datos])
        }
      } else {
        setMensaje('Punto rechazado correctamente')
      }

      setPuntosPendientes((puntosActuales) =>
        puntosActuales.filter((punto) => punto.id !== puntoId)
      )
    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setProcesando(null)
    }
  }

  // Métricas
  const totalUsuarios = usuarios.length
  const totalPendientes = puntosPendientes.length
  const totalAprobados = puntosAprobados.length
  const totalPuntos = totalPendientes + totalAprobados

  // Porcentaje para visualización simple de aprobado vs pendiente
  const porcentajeAprobados = totalPuntos > 0 ? Math.round((totalAprobados / totalPuntos) * 100) : 0
  const porcentajePendientes = totalPuntos > 0 ? Math.round((totalPendientes / totalPuntos) * 100) : 0

  // Framer Motion Variants para transiciones fluidas y stagger
  const contenedorVariantes = {
    oculto: {},
    visible: {
      transition: {
        staggerChildren: prefiereReducido ? 0 : 0.08
      }
    }
  }

  const elementoVariantes = {
    oculto: { opacity: 0, y: prefiereReducido ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    },
    salida: {
      opacity: 0,
      x: prefiereReducido ? 0 : -30,
      scale: prefiereReducido ? 1 : 0.95,
      transition: { duration: 0.25, ease: 'easeInOut' }
    }
  }

  const tabVariantes = {
    oculto: { opacity: 0, x: prefiereReducido ? 0 : 15 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    salida: { opacity: 0, x: prefiereReducido ? 0 : -15, transition: { duration: 0.2, ease: 'easeIn' } }
  }

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] font-sans selection:bg-[#218739]/10 selection:text-[#176b2b] transition-colors duration-300">
      {/* Header del Dashboard con toque de Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2320]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/40 py-5 px-4 sm:px-6 lg:px-8 shadow-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <motion.span
                className="text-2xl"
                animate={prefiereReducido ? {} : { rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              >
                🌱
              </motion.span>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">eco-TRACE</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-1 font-medium">Panel de Control y Administración General</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Contenedor de Pestañas con animación sutil */}
            <div className="bg-gray-100 dark:bg-[#121816] p-1 rounded-xl flex items-center gap-1 transition-colors">
              <button
                type="button"
                onClick={() => setPestañaActiva('resumen')}
                className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${pestañaActiva === 'resumen' ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-xs' : 'text-gray-500 dark:text-[#a8b3ae] hover:text-gray-700 dark:hover:text-[#f2f5f3]'}`}
              >
                📊 Resumen
              </button>
              <button
                type="button"
                onClick={() => setPestañaActiva('pendientes')}
                className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${pestañaActiva === 'pendientes' ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-xs' : 'text-gray-500 dark:text-[#a8b3ae] hover:text-gray-700 dark:hover:text-[#f2f5f3]'}`}
              >
                ⏳ Pendientes
                {totalPendientes > 0 && (
                  <span className="bg-[#218739] dark:bg-[#2fa350] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {totalPendientes}
                  </span>
                )}
              </button>
            </div>

            <motion.button
              type="button"
              whileHover={prefiereReducido ? {} : { scale: 1.02 }}
              whileTap={prefiereReducido ? {} : { scale: 0.98 }}
              onClick={cargarDatosDashboard}
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#218739] to-[#1c7330] dark:from-[#2fa350] dark:to-[#1c7330] hover:from-[#176b2b] dark:hover:from-[#218739] rounded-xl shadow-sm transition-all duration-150 cursor-pointer focus:outline-hidden"
            >
              🔄 Actualizar
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Mensajes de feedback animados */}
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#d93025] dark:border-[#ef5350] rounded-r-2xl text-xs font-semibold text-[#d93025] dark:text-[#ef5350] flex items-center gap-2"
            >
              <span className="text-sm">⚠️</span> {error}
            </motion.div>
          )}

          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-[#218739] dark:border-[#2fa350] rounded-r-2xl text-xs font-semibold text-[#218739] dark:text-[#2fa350] flex items-center gap-2"
            >
              <span className="text-sm">🎉</span> {mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENIDO INTERACTIVO DE LAS PESTAÑAS */}
        <AnimatePresence mode="wait">
          {pestañaActiva === 'resumen' ? (
            <motion.div
              key="resumen"
              variants={tabVariantes}
              initial="oculto"
              animate="visible"
              exit="salida"
              className="space-y-8"
            >
              {/* Sección de Métricas con entrada stagger */}
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-[#a8b3ae] mb-4 flex items-center gap-2">
                  <span>📈</span> Métricas Clave de la Plataforma
                </h2>

                {cargando ? (
                  /* SKELETON LOADER PARA METRICAS */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-xs animate-pulse">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    variants={contenedorVariantes}
                    initial="oculto"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
                  >
                    {/* Tarjeta 1: Usuarios */}
                    <motion.div
                      variants={elementoVariantes}
                      whileHover={prefiereReducido ? {} : { y: -4, scale: 1.01 }}
                      className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-50 dark:border-gray-800/30 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase tracking-wide">Usuarios</span>
                        <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-sm">👥</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-3xl font-black text-[#222222] dark:text-[#f2f5f3]">
                          <ContadorAnimado valor={totalUsuarios} />
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-[#a8b3ae] font-semibold mt-1">Ciudadanos registrados</p>
                      </div>
                    </motion.div>

                    {/* Tarjeta 2: Puntos Pendientes */}
                    <motion.div
                      variants={elementoVariantes}
                      whileHover={prefiereReducido ? {} : { y: -4, scale: 1.01 }}
                      className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-50 dark:border-gray-800/30 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase tracking-wide">Pendientes</span>
                        <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-sm">⏳</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-3xl font-black text-amber-500 dark:text-amber-400">
                          <ContadorAnimado valor={totalPendientes} />
                        </p>
                        <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-bold mt-1">Requieren moderación</p>
                      </div>
                    </motion.div>

                    {/* Tarjeta 3: Puntos Aprobados */}
                    <motion.div
                      variants={elementoVariantes}
                      whileHover={prefiereReducido ? {} : { y: -4, scale: 1.01 }}
                      className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-50 dark:border-gray-800/30 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase tracking-wide">Aprobados</span>
                        <span className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-sm font-bold">✓</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-3xl font-black text-[#218739] dark:text-[#2fa350]">
                          <ContadorAnimado valor={totalAprobados} />
                        </p>
                        <p className="text-[11px] text-green-600/80 dark:text-[#2fa350]/80 font-bold mt-1">Visibles en el mapa</p>
                      </div>
                    </motion.div>

                    {/* Tarjeta 4: Total */}
                    <motion.div
                      variants={elementoVariantes}
                      whileHover={prefiereReducido ? {} : { y: -4, scale: 1.01 }}
                      className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-50 dark:border-gray-800/30 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase tracking-wide">Total</span>
                        <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-[#2fa350] text-sm">🌱</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-3xl font-black text-[#222222] dark:text-[#f2f5f3]">
                          <ContadorAnimado valor={totalPuntos} />
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-[#a8b3ae] font-semibold mt-1">Registrados totales</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </section>

              {/* Bloque de Comparación Visual con Crecimiento Animado */}
              <section className="bg-white dark:bg-[#1a2320] p-6 sm:p-8 rounded-3xl border border-gray-50 dark:border-gray-800/30 shadow-xs">
                <h3 className="text-sm font-bold text-gray-700 dark:text-[#f2f5f3] mb-4">Proporción de Estados de Puntos</h3>
                {cargando ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-full"></div>
                    <div className="flex justify-between w-full">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-28"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-28"></div>
                    </div>
                  </div>
                ) : totalPuntos > 0 ? (
                  <div>
                    {/* Barra de progreso con transiciones animadas */}
                    <div className="w-full bg-gray-100 dark:bg-[#0f1512] h-5 rounded-full overflow-hidden flex">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${porcentajeAprobados}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68]"
                        title={`Aprobados: ${porcentajeAprobados}%`}
                      ></motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${porcentajePendientes}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                        className="bg-amber-400 dark:bg-amber-500"
                        title={`Pendientes: ${porcentajePendientes}%`}
                      ></motion.div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mt-4 text-xs font-semibold text-gray-500 dark:text-[#a8b3ae]">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#218739] dark:bg-[#2fa350]"></span>
                        <span>Aprobados: <strong className="text-gray-800 dark:text-[#f2f5f3]">{totalAprobados}</strong> ({porcentajeAprobados}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                        <span>Pendientes: <strong className="text-gray-800 dark:text-[#f2f5f3]">{totalPendientes}</strong> ({porcentajePendientes}%)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No hay puntos ecológicos registrados todavía.</p>
                )}
              </section>

              {/* Botón rápido para acceder al listado de pendientes */}
              {totalPendientes > 0 && !cargando && (
                <div className="flex justify-center pt-2">
                  <motion.button
                    type="button"
                    whileHover={prefiereReducido ? {} : { scale: 1.02 }}
                    whileTap={prefiereReducido ? {} : { scale: 0.98 }}
                    onClick={() => setPestañaActiva('pendientes')}
                    className="px-6 py-3 bg-[#218739]/10 dark:bg-[#2fa350]/10 hover:bg-[#218739]/15 dark:hover:bg-[#2fa350]/15 text-[#218739] dark:text-[#2fa350] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    🔍 Ver puntos pendientes en lista ({totalPendientes})
                  </motion.button>
                </div>
              )}
            </motion.div>
          ) : (
            /* PESTAÑA: PUNTOS PENDIENTES */
            <motion.div
              key="pendientes"
              variants={tabVariantes}
              initial="oculto"
              animate="visible"
              exit="salida"
              className="space-y-6"
            >
              <div className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-50 dark:border-gray-800/30 shadow-xs overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/30 dark:bg-[#1a2320]/30">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">Verificación Comunitaria</h3>
                    <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">Revisa detalladamente la información antes de aprobar o rechazar un punto.</p>
                  </div>
                  <span className="self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
                    ⚠️ {totalPendientes} pendientes
                  </span>
                </div>

                {cargando ? (
                  /* SKELETON ANIMADO DE TABLA */
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="flex justify-between items-center gap-4 animate-pulse border-b border-gray-50 dark:border-gray-800/30 pb-4">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4"></div>
                          <div className="h-3 bg-gray-100 dark:bg-gray-850 rounded-md w-1/2"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : puntosPendientes.length === 0 ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-16 text-center"
                  >
                    <span className="text-4xl">🎉</span>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-[#f2f5f3] mt-4">¡Todo al día!</h4>
                    <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-1 max-w-sm mx-auto px-4">
                      No hay puntos pendientes de verificación en este momento. Todos los envíos comunitarios han sido moderados de forma exitosa.
                    </p>
                  </motion.div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/40">
                      <thead>
                        <tr className="bg-gray-50/30 dark:bg-[#121816]/30 text-left text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase tracking-wider">
                          <th className="px-6 py-4">Punto ecológico</th>
                          <th className="px-6 py-4">Descripción</th>
                          <th className="px-6 py-4">Ubicación</th>
                          <th className="px-6 py-4">Creador</th>
                          <th className="px-6 py-4 text-right">Moderación</th>
                        </tr>
                      </thead>
                      <motion.tbody
                        variants={contenedorVariantes}
                        initial="oculto"
                        animate="visible"
                        className="divide-y divide-gray-100 dark:divide-gray-800/40 bg-white dark:bg-[#1a2320]"
                      >
                        <AnimatePresence mode="popLayout">
                          {puntosPendientes.map((punto) => (
                            <motion.tr
                              key={punto.id}
                              variants={elementoVariantes}
                              initial="oculto"
                              animate="visible"
                              exit="salida"
                              layout={!prefiereReducido}
                              className="hover:bg-gray-50/20 dark:hover:bg-gray-800/20 transition-colors duration-150"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-extrabold text-gray-900 dark:text-[#f2f5f3] text-sm">{punto.nombre}</div>
                                <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-lg bg-[#f1f8f4] dark:bg-[#0f1512] text-[#218739] dark:text-[#2fa350] border border-[#218739]/10 dark:border-transparent uppercase">
                                  {punto.tipo}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-xs line-clamp-2" title={punto.descripcion}>
                                  {punto.descripcion}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-xs text-gray-800 dark:text-[#f2f5f3] font-bold">{punto.direccion}</div>
                                <div className="text-[11px] text-gray-400 mt-0.5 font-semibold">{punto.localidad}</div>
                                <div className="text-[10px] text-gray-400 mt-1 font-mono">
                                  {punto.latitud.toFixed(5)}, {punto.longitud.toFixed(5)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-[#a8b3ae]">
                                ID {punto.usuario_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                <div className="flex items-center justify-end gap-2">
                                  <motion.button
                                    type="button"
                                    whileHover={prefiereReducido ? {} : { scale: 1.05 }}
                                    whileTap={prefiereReducido ? {} : { scale: 0.95 }}
                                    disabled={procesando === punto.id}
                                    onClick={() => cambiarEstado(punto.id, 'aprobar')}
                                    className="inline-flex items-center justify-center px-4.5 py-2 font-bold rounded-xl text-white bg-gradient-to-r from-[#218739] to-[#39aa53] hover:from-[#176b2b] hover:to-[#2b833e] dark:from-[#2fa350] dark:to-[#39aa53] disabled:from-gray-300 disabled:to-gray-300 shadow-xs cursor-pointer focus:outline-hidden"
                                  >
                                    {procesando === punto.id ? '...' : 'Aprobar'}
                                  </motion.button>
                                  <motion.button
                                    type="button"
                                    whileHover={prefiereReducido ? {} : { scale: 1.05 }}
                                    whileTap={prefiereReducido ? {} : { scale: 0.95 }}
                                    disabled={procesando === punto.id}
                                    onClick={() => cambiarEstado(punto.id, 'rechazar')}
                                    className="inline-flex items-center justify-center px-4.5 py-2 font-bold rounded-xl text-white bg-gradient-to-r from-[#d93025] to-[#f44336] hover:from-[#b3261e] hover:to-[#d32f2f] dark:from-[#ef5350] dark:to-[#d93025] disabled:from-gray-300 disabled:to-gray-300 shadow-xs cursor-pointer focus:outline-hidden"
                                  >
                                    Rechazar
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </motion.tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default Admin
export { ContadorAnimado }
