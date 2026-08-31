import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useReducedMotion
} from 'framer-motion'

const API_URL = 'http://127.0.0.1:8000'

// =========================================================
// HOOK CONTADOR
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
      if (!inicioRef.current) {
        inicioRef.current = marcaTiempo
      }

      const progreso = marcaTiempo - inicioRef.current

      const fraccion = Math.min(
        progreso / (duracion * 1000),
        1
      )

      const easingOut =
        1 - Math.pow(1 - fraccion, 2)

      const valorActual = Math.floor(
        inicio +
          (valorFinal - inicio) * easingOut
      )

      setConteo(valorActual)

      if (fraccion < 1) {
        idAnimacion =
          requestAnimationFrame(animar)
      }
    }

    idAnimacion =
      requestAnimationFrame(animar)

    return () => {
      cancelAnimationFrame(idAnimacion)
      inicioRef.current = null
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorFinal, duracion, prefiereReducido])

  return conteo
}

// =========================================================
// BADGE
// =========================================================

function Badge({ tipo, texto }) {
  const estilos = {
    pendiente:
      'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',

    aprobado:
      'bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border-green-200 dark:border-green-900/30',

    rechazado:
      'bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] border-red-200 dark:border-red-900/30',

    admin:
      'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30',

    usuario:
      'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',

    info:
      'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
  }

  const iconos = {
    pendiente: '⏳',
    aprobado: '✓',
    rechazado: '✕',
    admin: '🛡️',
    usuario: '👤',
    info: 'ℹ️'
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        rounded-full
        text-[11px]
        font-bold
        border
        uppercase
        tracking-wider
        ${estilos[tipo] || estilos.info}
      `}
    >
      <span>{iconos[tipo]}</span>
      <span>{texto}</span>
    </span>
  )
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  titulo,
  descripcion,
  icono = '🎉'
}) {
  return (
    <div className="py-16 text-center">
      <span className="text-4xl block mb-3">
        {icono}
      </span>

      <h4 className="text-lg font-bold text-gray-800 dark:text-[#f2f5f3]">
        {titulo}
      </h4>

      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 max-w-sm mx-auto px-4">
        {descripcion}
      </p>
    </div>
  )
}

// =========================================================
// BOTÓN DE CARGA
// =========================================================

function LoadingButton({
  cargando,
  texto,
  textoCargando,
  onClick,
  variante = 'primario',
  deshabilitado = false
}) {
  const prefiereReducido = useReducedMotion()

  const estilosVariante = {
    primario:
      'bg-gradient-to-r from-[#218739] to-[#39aa53] hover:from-[#176b2b] hover:to-[#2b833e] text-white',

    peligro:
      'bg-gradient-to-r from-[#d93025] to-[#f44336] hover:from-[#b3261e] hover:to-[#d32f2f] text-white',

    secundario:
      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-[#f2f5f3]',

    admin:
      'bg-purple-600 hover:bg-purple-700 text-white'
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={cargando || deshabilitado}
      whileHover={
        prefiereReducido || cargando || deshabilitado
          ? {}
          : { scale: 1.03 }
      }
      whileTap={
        prefiereReducido || cargando || deshabilitado
          ? {}
          : { scale: 0.97 }
      }
      className={`
        px-3.5 py-1.5
        font-bold
        rounded-xl
        text-xs
        transition-all
        flex
        items-center
        justify-center
        gap-1.5
        cursor-pointer
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${estilosVariante[variante]}
      `}
    >
      {cargando ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>
            {textoCargando || 'Procesando...'}
          </span>
        </>
      ) : (
        <span>{texto}</span>
      )}
    </motion.button>
  )
}

// =========================================================
// ADMIN
// =========================================================

function Admin() {
  const navigate = useNavigate()
  const prefiereReducido = useReducedMotion()

  const [puntosPendientes, setPuntosPendientes] =
    useState([])

  const [usuarios, setUsuarios] =
    useState([])

  const [puntosAprobados, setPuntosAprobados] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [mensaje, setMensaje] =
    useState('')

  const [error, setError] =
    useState('')

  const [procesandoId, setProcesandoId] =
    useState(null)

  const [usuarioProcesandoId, setUsuarioProcesandoId] =
    useState(null)

  const [esAdmin, setEsAdmin] =
    useState(false)

  const [miUsuarioId, setMiUsuarioId] =
    useState(null)

  const [pestañaActiva, setPestañaActiva] =
    useState('pendientes')

  // =========================================================
  // BUSCAR CREADOR
  // =========================================================

  const obtenerCreador = (usuarioId) => {
    return usuarios.find(
      (usuario) => usuario.id === usuarioId
    )
  }

  // =========================================================
  // VERIFICAR ADMIN
  // =========================================================

  useEffect(() => {
    const usuarioGuardado =
      localStorage.getItem('usuario')

    const token =
      localStorage.getItem('access_token')

    if (!token || !usuarioGuardado) {
      setError(
        'Debes iniciar sesión como administrador para acceder'
      )

      setCargando(false)
      return
    }

    try {
      const usuario =
        JSON.parse(usuarioGuardado)

      setMiUsuarioId(usuario.id)

      if (!usuario.es_admin) {
        setError(
          'No tienes permisos de administrador'
        )

        setCargando(false)
        return
      }

      setEsAdmin(true)

      cargarDatosDashboard(token)

    } catch (err) {
      console.error(err)

      setError(
        'Error validando sesión'
      )

      setCargando(false)
    }
  }, [])

  // =========================================================
  // CARGAR DATOS
  // =========================================================

  const cargarDatosDashboard = async (
    tokenProvisto
  ) => {
    const token =
      tokenProvisto ||
      localStorage.getItem('access_token')

    if (!token) {
      setError('No existe una sesión activa')
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')
      setMensaje('')

      // -----------------------------------------------------
      // PUNTOS PENDIENTES
      // -----------------------------------------------------

      const resPendientes =
        await fetch(
          `${API_URL}/admin/puntos/pendientes`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

      if (
        resPendientes.status === 401 ||
        resPendientes.status === 403
      ) {
        throw new Error(
          'Sesión no autorizada o sin permisos de administrador'
        )
      }

      if (!resPendientes.ok) {
        throw new Error(
          'Error al cargar puntos pendientes'
        )
      }

      const datosPendientes =
        await resPendientes.json()

      setPuntosPendientes(
        datosPendientes
      )

      // -----------------------------------------------------
      // USUARIOS
      // -----------------------------------------------------

      const resUsuarios =
        await fetch(
          `${API_URL}/admin/usuarios`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

      if (
        resUsuarios.status === 401 ||
        resUsuarios.status === 403
      ) {
        throw new Error(
          'No tienes autorización para consultar los usuarios'
        )
      }

      if (!resUsuarios.ok) {
        throw new Error(
          'Error al cargar usuarios'
        )
      }

      const datosUsuarios =
        await resUsuarios.json()

      setUsuarios(datosUsuarios)

      // -----------------------------------------------------
      // PUNTOS APROBADOS
      // -----------------------------------------------------

      const resAprobados =
        await fetch(
          `${API_URL}/puntos`
        )

      if (resAprobados.ok) {
        const datosAprobados =
          await resAprobados.json()

        setPuntosAprobados(
          datosAprobados
        )
      }

    } catch (err) {
      console.error(
        'Error cargando dashboard:',
        err
      )

      setError(
        err.message ||
        'Error al conectar con el servidor'
      )

    } finally {
      setCargando(false)
    }
  }

  // =========================================================
  // APROBAR / RECHAZAR PUNTO
  // =========================================================

  const cambiarEstado = async (
    puntoId,
    accion
  ) => {
    const token =
      localStorage.getItem('access_token')

    if (!token) {
      setError(
        'Tu sesión ha expirado'
      )
      return
    }

    try {
      setProcesandoId(puntoId)
      setError('')
      setMensaje('')

      const respuesta =
        await fetch(
          `${API_URL}/admin/puntos/${puntoId}/${accion}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

      let datos = null

      try {
        datos = await respuesta.json()
      } catch {
        datos = null
      }

      if (!respuesta.ok) {
        throw new Error(
          datos?.detail ||
          'No se pudo procesar el punto'
        )
      }

      if (accion === 'aprobar') {
        setMensaje(
          'Punto aprobado correctamente'
        )

        if (datos) {
          setPuntosAprobados(
            (prev) => {
              const yaExiste =
                prev.some(
                  (punto) =>
                    punto.id === datos.id
                )

              if (yaExiste) {
                return prev
              }

              return [
                ...prev,
                datos
              ]
            }
          )
        }
      }

      if (accion === 'rechazar') {
        setMensaje(
          'Punto rechazado correctamente'
        )
      }

      setPuntosPendientes(
        (puntosActuales) =>
          puntosActuales.filter(
            (punto) =>
              punto.id !== puntoId
          )
      )

    } catch (err) {
      console.error(
        'Error cambiando estado:',
        err
      )

      setError(
        err.message ||
        'No se pudo procesar el punto'
      )

    } finally {
      setProcesandoId(null)
    }
  }

  // =========================================================
  // CAMBIAR ADMIN
  // =========================================================

  const cambiarAdministrador = async (
    usuarioId
  ) => {
    const token =
      localStorage.getItem('access_token')

    if (!token) {
      setError(
        'Tu sesión ha expirado'
      )
      return
    }

    if (usuarioId === miUsuarioId) {
      setError(
        'No puedes cambiar tus propios permisos de administrador'
      )
      return
    }

    try {
      setUsuarioProcesandoId(usuarioId)
      setError('')
      setMensaje('')

      const respuesta =
        await fetch(
          `${API_URL}/admin/usuarios/${usuarioId}/admin`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

      const datos =
        await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos?.detail ||
          'No se pudieron cambiar los permisos'
        )
      }

      setUsuarios(
        (usuariosActuales) =>
          usuariosActuales.map(
            (usuario) =>
              usuario.id === usuarioId
                ? datos
                : usuario
          )
      )

      setMensaje(
        datos.es_admin
          ? 'Usuario convertido en administrador'
          : 'Permisos de administrador retirados'
      )

    } catch (err) {
      console.error(err)

      setError(
        err.message ||
        'No se pudieron cambiar los permisos'
      )

    } finally {
      setUsuarioProcesandoId(null)
    }
  }

  // =========================================================
  // ELIMINAR USUARIO
  // =========================================================

  const eliminarUsuario = async (
    usuarioId
  ) => {
    const token =
      localStorage.getItem('access_token')

    if (!token) {
      setError(
        'Tu sesión ha expirado'
      )
      return
    }

    if (usuarioId === miUsuarioId) {
      setError(
        'No puedes eliminar tu propia cuenta'
      )
      return
    }

    const usuario =
      usuarios.find(
        (item) => item.id === usuarioId
      )

    const confirmar =
      window.confirm(
        `¿Seguro que quieres eliminar al usuario "${usuario?.nombre || 'este usuario'}"?\n\nTambién se eliminarán sus puntos y entregas relacionadas.`
      )

    if (!confirmar) {
      return
    }

    try {
      setUsuarioProcesandoId(usuarioId)
      setError('')
      setMensaje('')

      const respuesta =
        await fetch(
          `${API_URL}/admin/usuarios/${usuarioId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

      let datos = null

      try {
        datos = await respuesta.json()
      } catch {
        datos = null
      }

      if (!respuesta.ok) {
        throw new Error(
          datos?.detail ||
          'No se pudo eliminar el usuario'
        )
      }

      setUsuarios(
        (usuariosActuales) =>
          usuariosActuales.filter(
            (usuario) =>
              usuario.id !== usuarioId
          )
      )

      setPuntosPendientes(
        (puntosActuales) =>
          puntosActuales.filter(
            (punto) =>
              punto.usuario_id !== usuarioId
          )
      )

      setPuntosAprobados(
        (puntosActuales) =>
          puntosActuales.filter(
            (punto) =>
              punto.usuario_id !== usuarioId
          )
      )

      setMensaje(
        'Usuario eliminado correctamente'
      )

    } catch (err) {
      console.error(err)

      setError(
        err.message ||
        'No se pudo eliminar el usuario'
      )

    } finally {
      setUsuarioProcesandoId(null)
    }
  }

  // =========================================================
  // ESTADÍSTICAS
  // =========================================================

  const totalUsuariosVal =
    useCountUp(
      usuarios.length
    )

  const totalPendientesVal =
    useCountUp(
      puntosPendientes.length
    )

  const totalAprobadosVal =
    useCountUp(
      puntosAprobados.length
    )

  const totalPuntosSum =
    puntosPendientes.length +
    puntosAprobados.length

  const totalPuntosVal =
    useCountUp(
      totalPuntosSum
    )

  const porcentajeAprobados =
    totalPuntosSum > 0
      ? Math.round(
          (puntosAprobados.length /
            totalPuntosSum) *
            100
        )
      : 0

  const porcentajePendientes =
    totalPuntosSum > 0
      ? Math.round(
          (puntosPendientes.length /
            totalPuntosSum) *
            100
        )
      : 0

  // =========================================================
  // ANIMACIONES
  // =========================================================

  const contenedorVariantes = {
    oculto: {},

    visible: {
      transition: {
        staggerChildren:
          prefiereReducido
            ? 0
            : 0.08
      }
    }
  }

  const elementoVariantes = {
    oculto: {
      opacity: 0,
      y: prefiereReducido
        ? 0
        : 15
    },

    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },

    salida: {
      opacity: 0,
      x: prefiereReducido
        ? 0
        : -30,

      transition: {
        duration: 0.25
      }
    }
  }

  // =========================================================
  // ACCESO RESTRINGIDO
  // =========================================================

  if (!cargando && !esAdmin) {
    return (
      <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] flex flex-col items-center justify-center p-6 text-center font-sans">

        <span className="text-5xl mb-4">
          🛡️
        </span>

        <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-2">
          Acceso Restringido
        </h1>

        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-sm mb-6">
          {error ||
            'Solo los administradores autorizados pueden acceder a este panel.'}
        </p>

        <button
          onClick={() =>
            navigate('/login')
          }
          className="px-6 py-2.5 bg-[#218739] hover:bg-[#176b2b] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
        >
          Iniciar sesión
        </button>

      </div>
    )
  }

  // =========================================================
  // PANEL
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] font-sans transition-colors duration-300">

      {/* HEADER */}

      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1a2320]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/40 py-5 px-4 sm:px-6 lg:px-8 shadow-2xs">

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-2">




            </div>

            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 font-medium">
              Panel de Administración y Moderación Comunitaria
            </p>

          </div>

          <div className="flex items-center gap-3 flex-wrap">

            {/* TABS */}

            <div className="bg-gray-100 dark:bg-[#121816] p-1 rounded-xl flex items-center gap-1 flex-wrap">

              <button
                type="button"
                onClick={() =>
                  setPestañaActiva(
                    'pendientes'
                  )
                }
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  pestañaActiva ===
                  'pendientes'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                ⏳ Pendientes

                {puntosPendientes.length >
                  0 && (
                  <span className="bg-[#218739] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {puntosPendientes.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setPestañaActiva(
                    'usuarios'
                  )
                }
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  pestañaActiva ===
                  'usuarios'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                👥 Usuarios

                {usuarios.length >
                  0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {usuarios.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setPestañaActiva(
                    'resumen'
                  )
                }
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  pestañaActiva ===
                  'resumen'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                📊 Resumen
              </button>

            </div>

            {/* ACTUALIZAR */}

            <button
              type="button"
              onClick={() =>
                cargarDatosDashboard()
              }
              disabled={cargando}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#218739] hover:bg-[#176b2b] rounded-xl cursor-pointer disabled:opacity-50 transition-all"
            >
              {cargando
                ? '⏳ Cargando...'
                : '🔄 Actualizar'}
            </button>

          </div>

        </div>

      </header>

      {/* CONTENIDO */}

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">

        {/* MENSAJES */}

        <AnimatePresence>

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#d93025] text-xs font-bold text-[#d93025] dark:text-[#ef5350] rounded-r-xl"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {mensaje && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10
              }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{
                opacity: 0,
                y: -10
              }}
              className="p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-[#218739] text-xs font-bold text-[#218739] dark:text-[#2fa350] rounded-r-xl"
            >
              🎉 {mensaje}
            </motion.div>
          )}

        </AnimatePresence>

        {/* ESTADÍSTICAS */}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">

            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
              <span>Usuarios</span>

              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 text-sm">
                👥
              </span>
            </div>

            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              {cargando
                ? '...'
                : totalUsuariosVal}
            </div>

            <p className="text-[11px] text-gray-400 mt-1 font-semibold">
              Ciudadanos registrados
            </p>

          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">

            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
              <span>Pendientes</span>

              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 text-sm">
                ⏳
              </span>
            </div>

            <div className="mt-3 text-3xl font-black text-amber-500">
              {cargando
                ? '...'
                : totalPendientesVal}
            </div>

            <p className="text-[11px] text-amber-600/80 font-bold mt-1">
              Requieren revisión
            </p>

          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">

            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
              <span>Aprobados</span>

              <span className="p-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-[#218739] text-sm">
                ✓
              </span>
            </div>

            <div className="mt-3 text-3xl font-black text-[#218739]">
              {cargando
                ? '...'
                : totalAprobadosVal}
            </div>

            <p className="text-[11px] text-green-600/80 font-bold mt-1">
              Visibles en el mapa
            </p>

          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">

            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
              <span>Total Puntos</span>

              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-sm">
                🌱
              </span>
            </div>

            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              {cargando
                ? '...'
                : totalPuntosVal}
            </div>

            <p className="text-[11px] text-gray-400 mt-1 font-semibold">
              Pendientes + aprobados
            </p>

          </div>

        </section>

        {/* =====================================================
            PESTAÑA USUARIOS
        ===================================================== */}

        {pestañaActiva ===
        'usuarios' ? (

          <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-[#121816]/30">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                    Usuarios registrados
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                    Administra los usuarios registrados en Eco-TRACE.
                  </p>
                </div>

                <Badge
                  tipo="usuario"
                  texto={`${usuarios.length} usuarios`}
                />

              </div>

            </div>

            {cargando ? (

              <div className="p-8 text-center text-sm text-gray-400">
                ⏳ Cargando usuarios...
              </div>

            ) : usuarios.length === 0 ? (

              <EmptyState
                titulo="No hay usuarios"
                descripcion="No existen usuarios registrados en el sistema."
                icono="👥"
              />

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/40">

                  <thead>

                    <tr className="bg-gray-50/30 dark:bg-[#121816]/30 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">

                      <th className="px-6 py-4">
                        ID
                      </th>

                      <th className="px-6 py-4">
                        Usuario
                      </th>

                      <th className="px-6 py-4">
                        Correo
                      </th>

                      <th className="px-6 py-4">
                        Rol
                      </th>

                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <motion.tbody
                    variants={contenedorVariantes}
                    initial="oculto"
                    animate="visible"
                    className="divide-y divide-gray-100 dark:divide-gray-800/40"
                  >

                    <AnimatePresence>

                      {usuarios.map(
                        (usuario) => {

                          const esMiCuenta =
                            usuario.id === miUsuarioId

                          const procesando =
                            usuarioProcesandoId ===
                            usuario.id

                          return (
                            <motion.tr
                              key={usuario.id}
                              variants={
                                elementoVariantes
                              }
                              initial="oculto"
                              animate="visible"
                              exit="salida"
                              className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20"
                            >

                              <td className="px-6 py-4 whitespace-nowrap">

                                <span className="text-xs font-mono font-bold text-gray-500 dark:text-[#a8b3ae]">
                                  #{usuario.id}
                                </span>

                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">

                                <div className="flex items-center gap-3">

                                  <div className="w-9 h-9 rounded-full bg-[#f1f8f4] dark:bg-[#0f1512] flex items-center justify-center text-[#218739] dark:text-[#2fa350] font-black">
                                    {usuario.nombre
                                      ?.charAt(0)
                                      ?.toUpperCase()}
                                  </div>

                                  <div>
                                    <div className="text-xs font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                                      {usuario.nombre}
                                    </div>

                                    {esMiCuenta && (
                                      <span className="text-[10px] text-gray-400">
                                        Tu cuenta
                                      </span>
                                    )}
                                  </div>

                                </div>

                              </td>

                              <td className="px-6 py-4">

                                <span className="text-xs text-gray-600 dark:text-[#a8b3ae]">
                                  {usuario.correo}
                                </span>

                              </td>

                              <td className="px-6 py-4">

                                {usuario.es_admin ? (
                                  <Badge
                                    tipo="admin"
                                    texto="Administrador"
                                  />
                                ) : (
                                  <Badge
                                    tipo="usuario"
                                    texto="Usuario"
                                  />
                                )}

                              </td>

                              <td className="px-6 py-4">

                                <div className="flex items-center justify-end gap-2">

                                  <LoadingButton
                                    cargando={
                                      procesando
                                    }
                                    texto={
                                      usuario.es_admin
                                        ? 'Quitar admin'
                                        : 'Hacer admin'
                                    }
                                    textoCargando="..."
                                    variante={
                                      usuario.es_admin
                                        ? 'secundario'
                                        : 'admin'
                                    }
                                    onClick={() =>
                                      cambiarAdministrador(
                                        usuario.id
                                      )
                                    }
                                    deshabilitado={
                                      esMiCuenta ||
                                      procesando
                                    }
                                  />

                                  <LoadingButton
                                    cargando={
                                      procesando
                                    }
                                    texto="Eliminar"
                                    textoCargando="..."
                                    variante="peligro"
                                    onClick={() =>
                                      eliminarUsuario(
                                        usuario.id
                                      )
                                    }
                                    deshabilitado={
                                      esMiCuenta ||
                                      procesando
                                    }
                                  />

                                </div>

                              </td>

                            </motion.tr>
                          )
                        }
                      )}

                    </AnimatePresence>

                  </motion.tbody>

                </table>

              </div>

            )}

          </section>

        ) : pestañaActiva ===
          'pendientes' ? (

          /* =====================================================
             PESTAÑA PENDIENTES
          ===================================================== */

          <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 flex items-center justify-between bg-gray-50/30 dark:bg-[#121816]/30">

              <div>

                <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                  Puntos Pendientes de Verificación
                </h3>

                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                  Revisa la información antes de aprobar o rechazar un punto enviado por la comunidad.
                </p>

              </div>

              <Badge
                tipo="pendiente"
                texto={`${puntosPendientes.length} pendientes`}
              />

            </div>

            {cargando ? (

              <div className="p-8 text-center text-gray-400">
                ⏳ Cargando puntos...
              </div>

            ) : puntosPendientes.length ===
              0 ? (

              <EmptyState
                titulo="¡Bandeja al día!"
                descripcion="No hay puntos pendientes de verificación en este momento."
                icono="🎉"
              />

            ) : (

              <div className="overflow-x-auto">

                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/40">

                  <thead>

                    <tr className="bg-gray-50/30 dark:bg-[#121816]/30 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">

                      <th className="px-6 py-4">
                        Punto ecológico
                      </th>

                      <th className="px-6 py-4">
                        Descripción
                      </th>

                      <th className="px-6 py-4">
                        Ubicación
                      </th>

                      <th className="px-6 py-4">
                        Creador
                      </th>

                      <th className="px-6 py-4 text-right">
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <motion.tbody
                    variants={contenedorVariantes}
                    initial="oculto"
                    animate="visible"
                    className="divide-y divide-gray-100 dark:divide-gray-800/40"
                  >

                    <AnimatePresence>

                      {puntosPendientes.map(
                        (punto) => {

                          const creador =
                            obtenerCreador(
                              punto.usuario_id
                            )

                          return (
                            <motion.tr
                              key={punto.id}
                              variants={
                                elementoVariantes
                              }
                              initial="oculto"
                              animate="visible"
                              exit="salida"
                            >

                              <td className="px-6 py-4 whitespace-nowrap">

                                <div className="font-extrabold text-gray-900 dark:text-[#f2f5f3] text-sm">
                                  {punto.nombre}
                                </div>

                                <span className="inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-lg bg-[#f1f8f4] dark:bg-[#0f1512] text-[#218739] uppercase">
                                  {punto.tipo}
                                </span>

                              </td>

                              <td className="px-6 py-4">

                                <p
                                  className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-xs"
                                  title={punto.descripcion}
                                >
                                  {punto.descripcion}
                                </p>

                              </td>

                              <td className="px-6 py-4">

                                <div className="text-xs text-gray-800 dark:text-[#f2f5f3] font-bold">
                                  {punto.direccion}
                                </div>

                                <div className="text-[11px] text-gray-400 mt-0.5">
                                  {punto.localidad}
                                </div>

                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  {Number(
                                    punto.latitud
                                  ).toFixed(5)}
                                  {', '}
                                  {Number(
                                    punto.longitud
                                  ).toFixed(5)}
                                </div>

                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">

                                {creador ? (

                                  <div>

                                    <div className="text-xs font-bold text-gray-800 dark:text-[#f2f5f3]">
                                      {creador.nombre}
                                    </div>

                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                      {creador.correo}
                                    </div>

                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      ID: {creador.id}
                                    </div>

                                  </div>

                                ) : (

                                  <span className="text-xs text-gray-500">
                                    Usuario #{punto.usuario_id}
                                  </span>

                                )}

                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">

                                <div className="flex items-center justify-end gap-2">

                                  <LoadingButton
                                    cargando={
                                      procesandoId ===
                                      punto.id
                                    }
                                    texto="Aprobar"
                                    variante="primario"
                                    onClick={() =>
                                      cambiarEstado(
                                        punto.id,
                                        'aprobar'
                                      )
                                    }
                                    deshabilitado={
                                      procesandoId !==
                                      null
                                    }
                                  />

                                  <LoadingButton
                                    cargando={
                                      procesandoId ===
                                      punto.id
                                    }
                                    texto="Rechazar"
                                    variante="peligro"
                                    onClick={() =>
                                      cambiarEstado(
                                        punto.id,
                                        'rechazar'
                                      )
                                    }
                                    deshabilitado={
                                      procesandoId !==
                                      null
                                    }
                                  />

                                </div>

                              </td>

                            </motion.tr>
                          )
                        }
                      )}

                    </AnimatePresence>

                  </motion.tbody>

                </table>

              </div>

            )}

          </section>

        ) : (

          /* =====================================================
             RESUMEN
          ===================================================== */

          <section className="bg-white dark:bg-[#1a2320] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs space-y-6">

            <div>

              <h3 className="text-sm font-bold text-gray-700 dark:text-[#f2f5f3]">
                Proporción de Estado de Puntos Ecológicos
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Distribución actual entre puntos aprobados y pendientes.
              </p>

            </div>

            {totalPuntosSum > 0 ? (

              <div>

                <div className="w-full bg-gray-100 dark:bg-[#0f1512] h-5 rounded-full overflow-hidden flex">

                  <motion.div
                    initial={{
                      width: 0
                    }}
                    animate={{
                      width: `${porcentajeAprobados}%`
                    }}
                    transition={{
                      duration: 1,
                      ease: 'easeOut'
                    }}
                    className="bg-gradient-to-r from-[#218739] to-[#4caf68]"
                  />

                  <motion.div
                    initial={{
                      width: 0
                    }}
                    animate={{
                      width: `${porcentajePendientes}%`
                    }}
                    transition={{
                      duration: 1,
                      ease: 'easeOut'
                    }}
                    className="bg-amber-400"
                  />

                </div>

                <div className="flex justify-between mt-4 text-xs font-semibold text-gray-500 dark:text-[#a8b3ae]">

                  <span>
                    🟢 Aprobados: <strong>{puntosAprobados.length}</strong> ({porcentajeAprobados}%)
                  </span>

                  <span>
                    🟡 Pendientes: <strong>{puntosPendientes.length}</strong> ({porcentajePendientes}%)
                  </span>

                </div>

              </div>

            ) : (

              <p className="text-xs text-gray-400 italic">
                No hay puntos ecológicos registrados en el sistema.
              </p>

            )}

          </section>

        )}

      </main>

    </div>
  )
}

export default Admin