import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

// =========================================================
// HOOK PERSONALIZADO: useCountUp
// =========================================================
function useCountUp(valorFinal, duracion = 1) {
  const [conteo, setConteo] = useState(0)
  const inicioRef = useRef(null)
  const prefiereReducido = useReducedMotion()

  useEffect(() => {
    if (prefiereReducido) {
      setConteo(valorFinal)
      return
    }

    let idAnimacion
    const inicio = conteo

    const animar = (marcaTiempo) => {
      if (!inicioRef.current) inicioRef.current = marcaTiempo
      const progreso = marcaTiempo - inicioRef.current
      const fraccion = Math.min(progreso / (duracion * 1000), 1)
      const easingOut = 1 - Math.pow(1 - fraccion, 2)
      const valorActual = Math.floor(inicio + (valorFinal - inicio) * easingOut)

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
  }, [valorFinal, duracion, prefiereReducido])

  return conteo
}

// =========================================================
// COMPONENTE: Badge
// =========================================================
function Badge({ tipo, texto }) {
  const estilos = {
    pendiente: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    aprobado: 'bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border-green-200 dark:border-green-900/30',
    rechazado: 'bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] border-red-200 dark:border-red-900/30',
    info: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
  }

  const iconos = {
    pendiente: '⏳',
    aprobado: '✓',
    rechazado: '✕',
    info: 'ℹ️'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${estilos[tipo] || estilos.info}`}>
      <span>{iconos[tipo]}</span>
      <span>{texto}</span>
    </span>
  )
}

// =========================================================
// COMPONENTE: EmptyState
// =========================================================
function EmptyState({ titulo, descripcion, icono = '🎉' }) {
  return (
    <div className="py-16 text-center">
      <span className="text-4xl block mb-3">{icono}</span>
      <h4 className="text-lg font-bold text-gray-800 dark:text-[#f2f5f3]">{titulo}</h4>
      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 max-w-sm mx-auto px-4">{descripcion}</p>
    </div>
  )
}

// =========================================================
// COMPONENTE: LoadingButton
// =========================================================
function LoadingButton({ cargando, texto, textoCargando, onClick, variante = 'primario', deshabilitado = false }) {
  const prefiereReducido = useReducedMotion()

  const estilosVariante = {
    primario: 'bg-gradient-to-r from-[#218739] to-[#39aa53] dark:from-[#2fa350] dark:to-[#39aa53] hover:from-[#176b2b] hover:to-[#2b833e] text-white',
    peligro: 'bg-gradient-to-r from-[#d93025] to-[#f44336] dark:from-[#ef5350] dark:to-[#d93025] hover:from-[#b3261e] hover:to-[#d32f2f] text-white',
    secundario: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-[#f2f5f3]'
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={cargando || deshabilitado}
      whileHover={prefiereReducido || cargando || deshabilitado ? {} : { scale: 1.03 }}
      whileTap={prefiereReducido || cargando || deshabilitado ? {} : { scale: 0.97 }}
      className={`px-3.5 py-1.5 font-bold rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${estilosVariante[variante]}`}
    >
      {cargando ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{textoCargando || 'Procesando...'}</span>
        </>
      ) : (
        <span>{texto}</span>
      )}
    </motion.button>
  )
}

// =========================================================
// PÁGINA PRINCIPAL: Admin
// =========================================================
function Admin() {
  const navigate = useNavigate()
  const prefiereReducido = useReducedMotion()

  const [puntosPendientes, setPuntosPendientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [puntosAprobados, setPuntosAprobados] = useState([])

  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [procesandoId, setProcesandoId] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [pestañaActiva, setPestañaActiva] = useState('pendientes')

  // Verificación de rol de administrador
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    const token = localStorage.getItem('access_token')

    if (!token || !usuarioGuardado) {
      setError('Debes iniciar sesión como administrador para acceder')
      setCargando(false)
      return
    }

    try {
      const usuario = JSON.parse(usuarioGuardado)
      if (!usuario.es_admin) {
        setError('No tienes permisos de administrador')
        setCargando(false)
        return
      }
      setEsAdmin(true)
    } catch (err) {
      console.error(err)
      setError('Error validando sesión')
      setCargando(false)
      return
    }

    cargarDatosDashboard(token)
  }, [])

  const cargarDatosDashboard = async (tokenProvisto) => {
    const token = tokenProvisto || localStorage.getItem('access_token')
    if (!token) return

    try {
      setCargando(true)
      setError('')
      setMensaje('')

      // 1. Puntos pendientes
      const resPendientes = await fetch('http://127.0.0.1:8000/admin/puntos/pendientes', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!resPendientes.ok) {
        if (resPendientes.status === 401 || resPendientes.status === 403) {
          throw new Error('Sesión no autorizada')
        }
        throw new Error('Error al cargar puntos pendientes')
      }
      const datosPendientes = await resPendientes.json()
      setPuntosPendientes(datosPendientes)

      // 2. Usuarios registrados
      const resUsuarios = await fetch('http://127.0.0.1:8000/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (resUsuarios.ok) {
        const datosUsuarios = await resUsuarios.json()
        setUsuarios(datosUsuarios)
      }

      // 3. Puntos aprobados
      const resAprobados = await fetch('http://127.0.0.1:8000/puntos')
      if (resAprobados.ok) {
        const datosAprobados = await resAprobados.json()
        setPuntosAprobados(datosAprobados)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const cambiarEstado = async (puntoId, accion) => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('Tu sesión ha expirado')
      return
    }

    try {
      setProcesandoId(puntoId)
      setError('')
      setMensaje('')

      const respuesta = await fetch(`http://127.0.0.1:8000/admin/puntos/${puntoId}/${accion}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(datos.detail || 'No se pudo procesar el punto')
      }

      if (accion === 'aprobar') {
        setMensaje('Punto aprobado correctamente')
        if (datos) setPuntosAprobados((prev) => [...prev, datos])
      } else {
        setMensaje('Punto rechazado correctamente')
      }

      // Salida animada de la lista
      setPuntosPendientes((puntosActuales) =>
        puntosActuales.filter((p) => p.id !== puntoId)
      )
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setProcesandoId(null)
    }
  }

  // Valores numéricos para el CountUp
  const totalUsuariosVal = useCountUp(usuarios.length)
  const totalPendientesVal = useCountUp(puntosPendientes.length)
  const totalAprobadosVal = useCountUp(puntosAprobados.length)
  const totalPuntosVal = useCountUp(puntosPendientes.length + puntosAprobados.length)

  const totalPuntosSum = puntosPendientes.length + puntosAprobados.length
  const porcentajeAprobados = totalPuntosSum > 0 ? Math.round((puntosAprobados.length / totalPuntosSum) * 100) : 0
  const porcentajePendientes = totalPuntosSum > 0 ? Math.round((puntosPendientes.length / totalPuntosSum) * 100) : 0

  const contenedorVariantes = {
    oculto: {},
    visible: { transition: { staggerChildren: prefiereReducido ? 0 : 0.08 } }
  }

  const elementoVariantes = {
    oculto: { opacity: 0, y: prefiereReducido ? 0 : 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
    salida: { opacity: 0, x: prefiereReducido ? 0 : -30, transition: { duration: 0.25 } }
  }

  if (!cargando && !esAdmin) {
    return (
      <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] flex flex-col items-center justify-center p-6 text-center font-sans">
        <span className="text-5xl mb-4">🛡️</span>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Acceso Restringido</h1>
        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-sm mb-6">{error || 'Solo los administradores autorizados pueden acceder a este panel.'}</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-[#218739] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Iniciar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] font-sans transition-colors duration-300">
      {/* HEADER DEL DASHBOARD */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2320]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/40 py-5 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
                eco-TRACE
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 font-medium">
              Panel de Administración y Moderación Comunitaria
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* TABS DE NAVEGACIÓN */}
            <div className="bg-gray-100 dark:bg-[#121816] p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPestañaActiva('pendientes')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  pestañaActiva === 'pendientes'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                <span>⏳ Pendientes</span>
                {puntosPendientes.length > 0 && (
                  <span className="bg-[#218739] dark:bg-[#2fa350] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {puntosPendientes.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPestañaActiva('resumen')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  pestañaActiva === 'resumen'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                📊 Resumen
              </button>
            </div>

            <button
              type="button"
              onClick={() => cargarDatosDashboard()}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#218739] dark:bg-[#2fa350] hover:bg-[#176b2b] rounded-xl cursor-pointer"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* MENSAJES DE ERROR O ÉXITO */}
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#d93025] text-xs font-bold text-[#d93025] dark:text-[#ef5350] rounded-r-xl"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {mensaje && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-[#218739] text-xs font-bold text-[#218739] dark:text-[#2fa350] rounded-r-xl"
            >
              🎉 {mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        {/* TARJETAS DE ESTADÍSTICAS ANIMADAS (COUNT-UP) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Usuarios</span>
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-sm">👥</span>
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              {cargando ? '...' : totalUsuariosVal}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-semibold">Ciudadanos activos</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Pendientes</span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-sm">⏳</span>
            </div>
            <div className="mt-3 text-3xl font-black text-amber-500 dark:text-amber-400">
              {cargando ? '...' : totalPendientesVal}
            </div>
            <p className="text-[11px] text-amber-600/80 font-bold mt-1">Requieren revisión</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Aprobados</span>
              <span className="p-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] text-sm">✓</span>
            </div>
            <div className="mt-3 text-3xl font-black text-[#218739] dark:text-[#2fa350]">
              {cargando ? '...' : totalAprobadosVal}
            </div>
            <p className="text-[11px] text-green-600/80 font-bold mt-1">Visibles en el mapa</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Total Puntos</span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 text-sm">🌱</span>
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              {cargando ? '...' : totalPuntosVal}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-semibold">Registros totales</p>
          </div>
        </section>

        {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
        {pestañaActiva === 'pendientes' ? (
          /* TABLA DE PUNTOS PENDIENTES DE REVISIÓN */
          <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden transition-colors">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 flex items-center justify-between bg-gray-50/30 dark:bg-[#121816]/30">
              <div>
                <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                  Puntos Pendientes de Verificación
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                  Revisa detalladamente la información antes de aprobar o rechazar un punto enviado por la comunidad.
                </p>
              </div>
              <Badge tipo="pendiente" texto={`${puntosPendientes.length} pendientes`} />
            </div>

            {cargando ? (
              /* SKELETON LOADERS DE TABLA */
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex justify-between items-center gap-4 animate-pulse pb-4 border-b border-gray-50 dark:border-gray-800/30">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : puntosPendientes.length === 0 ? (
              <EmptyState
                titulo="¡Bandeja al día!"
                descripcion="No hay puntos pendientes de verificación en este momento. Todos los envíos comunitarios han sido revisados."
                icono="🎉"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/40">
                  <thead>
                    <tr className="bg-gray-50/30 dark:bg-[#121816]/30 text-left text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase tracking-wider">
                      <th className="px-6 py-4">Punto ecológico</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4">Ubicación</th>
                      <th className="px-6 py-4">Creador</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
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
                          className="hover:bg-gray-50/20 dark:hover:bg-gray-800/20 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-extrabold text-gray-900 dark:text-[#f2f5f3] text-sm">
                              {punto.nombre}
                            </div>
                            <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-lg bg-[#f1f8f4] dark:bg-[#0f1512] text-[#218739] dark:text-[#2fa350] uppercase">
                              {punto.tipo}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-xs line-clamp-2" title={punto.descripcion}>
                              {punto.descripcion}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-800 dark:text-[#f2f5f3] font-bold">
                              {punto.direccion}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5 font-semibold">
                              {punto.localidad}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {punto.latitud.toFixed(5)}, {punto.longitud.toFixed(5)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-[#a8b3ae]">
                            ID Usuario: {punto.usuario_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex items-center justify-end gap-2">
                              <LoadingButton
                                cargando={procesandoId === punto.id}
                                texto="Aprobar"
                                textoCargando="..."
                                variante="primario"
                                onClick={() => cambiarEstado(punto.id, 'aprobar')}
                                deshabilitado={procesandoId !== null}
                              />
                              <LoadingButton
                                cargando={procesandoId === punto.id}
                                texto="Rechazar"
                                textoCargando="..."
                                variante="peligro"
                                onClick={() => cambiarEstado(punto.id, 'rechazar')}
                                deshabilitado={procesandoId !== null}
                              />
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </motion.tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          /* RESUMEN PROPORCIONAL Y VISUAL DE PUNTOS */
          <section className="bg-white dark:bg-[#1a2320] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-gray-700 dark:text-[#f2f5f3]">
              Proporción de Estado de Puntos Ecológicos
            </h3>

            {totalPuntosSum > 0 ? (
              <div>
                <div className="w-full bg-gray-100 dark:bg-[#0f1512] h-5 rounded-full overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${porcentajeAprobados}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68]"
                  ></motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${porcentajePendientes}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                    className="bg-amber-400 dark:bg-amber-500"
                  ></motion.div>
                </div>

                <div className="flex justify-between items-center mt-4 text-xs font-semibold text-gray-500 dark:text-[#a8b3ae]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#218739] dark:bg-[#2fa350]"></span>
                    <span>Aprobados: <strong>{puntosAprobados.length}</strong> ({porcentajeAprobados}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span>Pendientes: <strong>{puntosPendientes.length}</strong> ({porcentajePendientes}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No hay puntos ecológicos registrados en el sistema.</p>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default Admin
