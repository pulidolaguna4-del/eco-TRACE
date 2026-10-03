import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  AnimatePresence,
  useReducedMotion
} from 'framer-motion'
import { normalizarPunto } from '../utils/puntoUtils'
import { CategoriasBadges } from '../components/CategoriasBadges'

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

  const [todosLosPuntos, setTodosLosPuntos] =
    useState([])

  const [puntoEliminandoId, setPuntoEliminandoId] =
    useState(null)

  // Reportes enviados por la comunidad sobre puntos ecológicos.
  const [reportes, setReportes] = useState([])
  const [entregas, setEntregas] = useState([])
  const [observacionesReportes, setObservacionesReportes] = useState({})
  const [reporteProcesandoId, setReporteProcesandoId] = useState(null)

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

      const pendientesNormalizados =
        datosPendientes.map(normalizarPunto)

      setPuntosPendientes(
        pendientesNormalizados
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

        const aprobadosNormalizados =
          datosAprobados.map(normalizarPunto)

        setPuntosAprobados(
          aprobadosNormalizados
        )
      }

      // -----------------------------------------------------
      // TODOS LOS PUNTOS - ADMIN
      // -----------------------------------------------------

      const resTodosLosPuntos =
        await fetch(
          `${API_URL}/admin/puntos`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

      if (
        resTodosLosPuntos.status === 401 ||
        resTodosLosPuntos.status === 403
      ) {
        throw new Error(
          'No tienes autorización para consultar todos los puntos'
        )
      }

      if (!resTodosLosPuntos.ok) {
        throw new Error(
          'Error al cargar todos los puntos'
        )
      }

      const datosTodosLosPuntos =
        await resTodosLosPuntos.json()

      const puntosNormalizados =
        datosTodosLosPuntos.map(normalizarPunto)

      setTodosLosPuntos(
        puntosNormalizados
      )

      // -----------------------------------------------------
      // REPORTES DE LA COMUNIDAD
      // -----------------------------------------------------

      try {
        const resReportes = await fetch(
          `${API_URL}/admin/reportes`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!resReportes.ok) {
          let detalle = null

          try {
            detalle = await resReportes.json()
          } catch {
            detalle = null
          }

          throw new Error(
            detalle?.detail ||
            'No se pudieron cargar los reportes'
          )
        }

        const datosReportes =
          await resReportes.json()

        setReportes(
          Array.isArray(datosReportes)
            ? datosReportes
            : []
        )

      } catch (errorReportes) {

        console.error(
          'Error cargando reportes:',
          errorReportes
        )

        setReportes([])

        setError((mensajeActual) =>
          mensajeActual ||
          `${errorReportes.message}. Verifica que la ruta /admin/reportes esté implementada en el backend.`
        )
      }
  
      // -----------------------------------------------------
      // ENTREGAS REGISTRADAS
      // -----------------------------------------------------

      try {
        const resEntregas = await fetch(
          `${API_URL}/admin/entregas`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (!resEntregas.ok) {
          let detalle = null

          try {
            detalle = await resEntregas.json()
          } catch {
            detalle = null
          }

          throw new Error(
            detalle?.detail ||
            'No se pudieron cargar las entregas'
          )
        }

        const datosEntregas =
          await resEntregas.json()

        setEntregas(
          Array.isArray(datosEntregas)
            ? datosEntregas
            : []
        )

      } catch (errorEntregas) {

        console.error(
          'Error cargando entregas:',
          errorEntregas
        )

        setEntregas([])

        setError((mensajeActual) =>
          mensajeActual ||
          `${errorEntregas.message}. Verifica que la ruta /admin/entregas esté implementada en el backend.`
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

      // -----------------------------------------------------
      // ACTUALIZAR PUNTO APROBADO
      // -----------------------------------------------------

      if (accion === 'aprobar') {

        setMensaje(
          'Punto aprobado correctamente'
        )

        if (datos) {

          const puntoNorm =
            normalizarPunto(datos)

          setPuntosAprobados(
            (prev) => {

              const yaExiste =
                prev.some(
                  (punto) =>
                    punto.id === puntoNorm.id
                )

              if (yaExiste) {
                return prev
              }

              return [
                ...prev,
                puntoNorm
              ]
            }
          )

          // Actualizar también la pestaña
          // "Todos los puntos".
          setTodosLosPuntos(
            (prev) =>
              prev.map(
                (punto) =>
                  punto.id === puntoNorm.id
                    ? puntoNorm
                    : punto
              )
          )
        }
      }

      // -----------------------------------------------------
      // ACTUALIZAR PUNTO RECHAZADO
      // -----------------------------------------------------

      if (accion === 'rechazar') {

        setMensaje(
          'Punto rechazado correctamente'
        )

        if (datos) {

          const puntoNorm =
            normalizarPunto(datos)

          setTodosLosPuntos(
            (prev) =>
              prev.map(
                (punto) =>
                  punto.id === puntoNorm.id
                    ? puntoNorm
                    : punto
              )
          )
        }
      }

      // -----------------------------------------------------
      // QUITAR DE PENDIENTES
      // -----------------------------------------------------

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
  // ELIMINAR PUNTO
  // =========================================================

  const eliminarPunto = async (
    puntoId
  ) => {

    const token =
      localStorage.getItem('access_token')

    if (!token) {
      setError(
        'Tu sesión ha expirado'
      )
      return
    }

    const punto =
      todosLosPuntos.find(
        (item) =>
          item.id === puntoId
      )

    const confirmar =
      window.confirm(
        `¿Seguro que quieres eliminar el punto "${punto?.nombre || 'este punto'}"?\n\nTambién se eliminarán los reportes, entregas y relaciones con categorías asociadas a este punto.`
      )

    if (!confirmar) {
      return
    }

    try {

      setPuntoEliminandoId(puntoId)
      setError('')
      setMensaje('')

      const respuesta =
        await fetch(
          `${API_URL}/admin/puntos/${puntoId}`,
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
          'No se pudo eliminar el punto'
        )
      }

      // -----------------------------------------------------
      // QUITAR EL PUNTO DE TODOS LOS PUNTOS
      // -----------------------------------------------------

      setTodosLosPuntos(
        (puntosActuales) =>
          puntosActuales.filter(
            (puntoActual) =>
              puntoActual.id !== puntoId
          )
      )

      // -----------------------------------------------------
      // QUITAR EL PUNTO DE PENDIENTES
      // -----------------------------------------------------

      setPuntosPendientes(
        (puntosActuales) =>
          puntosActuales.filter(
            (puntoActual) =>
              puntoActual.id !== puntoId
          )
      )

      // -----------------------------------------------------
      // QUITAR EL PUNTO DE APROBADOS
      // -----------------------------------------------------

      setPuntosAprobados(
        (puntosActuales) =>
          puntosActuales.filter(
            (puntoActual) =>
              puntoActual.id !== puntoId
          )
      )

      // -----------------------------------------------------
      // QUITAR REPORTES DEL PUNTO DE LA VISTA
      // -----------------------------------------------------

      setReportes(
        (reportesActuales) =>
          reportesActuales.filter(
            (reporte) =>
              reporte.punto_id !== puntoId
          )
      )

      setMensaje(
        datos?.mensaje ||
        'Punto eliminado correctamente'
      )

    } catch (err) {

      console.error(
        'Error eliminando punto:',
        err
      )

      setError(
        err.message ||
        'No se pudo eliminar el punto'
      )

    } finally {
      setPuntoEliminandoId(null)
    }
  }

  // =========================================================
  // REVISAR / DESCARTAR REPORTE
  // =========================================================

  const revisarReporte = async (
    reporteId,
    estado
  ) => {

    const token =
      localStorage.getItem('access_token')

    if (!token) {
      setError(
        'Tu sesión ha expirado'
      )
      return
    }

    if (
      !['revisado', 'descartado']
        .includes(estado)
    ) {
      setError(
        'El estado solicitado para el reporte no es válido'
      )
      return
    }

    try {

      setReporteProcesandoId(
        reporteId
      )

      setError('')
      setMensaje('')

      const respuesta =
        await fetch(
          `${API_URL}/admin/reportes/${reporteId}/revisar`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              estado,
              observacion_admin:
                (
                  observacionesReportes[
                    reporteId
                  ] || ''
                ).trim() || null
            })
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
          'No se pudo actualizar el reporte'
        )
      }

      setReportes(
        (actuales) =>
          actuales.map(
            (reporte) => {

              const idActual =
                reporte.id ??
                reporte.reporte_id

              if (
                idActual !== reporteId
              ) {
                return reporte
              }

              return {
                ...reporte,
                ...(datos &&
                typeof datos === 'object'
                  ? datos
                  : {}),
                estado,
                observacion_admin:
                  (
                    observacionesReportes[
                      reporteId
                    ] || ''
                  ).trim() || null
              }
            }
          )
      )

      setObservacionesReportes(
        (actuales) => {

          const nuevas = {
            ...actuales
          }

          delete nuevas[reporteId]

          return nuevas
        }
      )

      setMensaje(
        estado === 'revisado'
          ? 'Reporte marcado como revisado correctamente'
          : 'Reporte descartado correctamente'
      )

    } catch (err) {

      console.error(
        'Error revisando reporte:',
        err
      )

      setError(
        err.message ||
        'No se pudo actualizar el reporte'
      )

    } finally {
      setReporteProcesandoId(null)
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

      setUsuarioProcesandoId(
        usuarioId
      )

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
      setUsuarioProcesandoId(
        null
      )
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
        (item) =>
          item.id === usuarioId
      )

    const confirmar =
      window.confirm(
        `¿Seguro que quieres eliminar al usuario "${usuario?.nombre || 'este usuario'}"?\n\nTambién se eliminarán sus puntos y entregas relacionadas.`
      )

    if (!confirmar) {
      return
    }

    try {

      setUsuarioProcesandoId(
        usuarioId
      )

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

      // Quitar también los puntos del usuario
      // de la pestaña "Todos los puntos".
      setTodosLosPuntos(
        (puntosActuales) =>
          puntosActuales.filter(
            (punto) =>
              punto.usuario_id !== usuarioId
          )
      )

      // Evita dejar reportes huérfanos visualmente
      // después de que el backend confirme la eliminación.
      setReportes(
        (reportesActuales) =>
          reportesActuales.filter(
            (reporte) =>
              (
                reporte.usuario_id ??
                reporte.reportante_id ??
                reporte.usuario?.id ??
                reporte.reportante?.id
              ) !== usuarioId
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
      setUsuarioProcesandoId(
        null
      )
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
          (
            puntosAprobados.length /
            totalPuntosSum
          ) *
          100
        )
      : 0

  const porcentajePendientes =
    totalPuntosSum > 0
      ? Math.round(
          (
            puntosPendientes.length /
            totalPuntosSum
          ) *
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

              {/* PENDIENTES */}

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

              {/* =================================================
                  PUNTOS
              ================================================== */}

              <button
                type="button"
                onClick={() =>
                  setPestañaActiva(
                    'puntos'
                  )
                }
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  pestañaActiva ===
                  'puntos'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                📍 Puntos

                {todosLosPuntos.length >
                  0 && (
                  <span className="bg-[#218739] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {todosLosPuntos.length}
                  </span>
                )}
              </button>
    
              {/* ENTREGAS */}

              <button
                type="button"
                onClick={() =>
                  setPestañaActiva(
                    'entregas'
                  )
                }
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  pestañaActiva ===
                  'entregas'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                ♻️ Entregas

                {entregas.length >
                  0 && (
                  <span className="bg-[#218739] text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {entregas.length}
                  </span>
                )}
              </button>

              

              {/* USUARIOS */}

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

              {/* REPORTES */}

              <button
                type="button"
                onClick={() =>
                  setPestañaActiva(
                    'reportes'
                  )
                }
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
                  pestañaActiva ===
                  'reportes'
                    ? 'bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] shadow-2xs'
                    : 'text-gray-500 dark:text-[#a8b3ae]'
                }`}
              >
                🚩 Reportes

                {reportes.filter(
                  (reporte) =>
                    (
                      reporte.estado ||
                      'pendiente'
                    ) === 'pendiente'
                ).length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {
                      reportes.filter(
                        (reporte) =>
                          (
                            reporte.estado ||
                            'pendiente'
                          ) === 'pendiente'
                      ).length
                    }
                  </span>
                )}
              </button>

              {/* RESUMEN */}

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
    PESTAÑA PUNTOS
===================================================== */}

{pestañaActiva === 'puntos' ? (

  <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden">

    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-[#121816]/30">

      <div className="flex items-center justify-between gap-4 flex-wrap">

        <div>

          <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
            Todos los puntos ecológicos
          </h3>

          <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
            Consulta y administra todos los puntos registrados en Eco-TRACE.
          </p>

        </div>

        <Badge
          tipo="info"
          texto={`${todosLosPuntos.length} puntos`}
        />

      </div>

    </div>

    {cargando ? (

      <div className="p-8 text-center text-sm text-gray-400">
        ⏳ Cargando puntos...
      </div>

    ) : todosLosPuntos.length === 0 ? (

      <EmptyState
        titulo="No hay puntos registrados"
        descripcion="Actualmente no existen puntos ecológicos registrados en el sistema."
        icono="📍"
      />

    ) : (

      <div className="overflow-x-auto">

        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/40">

          <thead>

            <tr className="bg-gray-50/30 dark:bg-[#121816]/30 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">

              <th className="px-6 py-4">
                Punto
              </th>

              <th className="px-6 py-4">
                Ubicación
              </th>

              <th className="px-6 py-4">
                Categorías
              </th>

              <th className="px-6 py-4">
                Estado
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

              {todosLosPuntos.map(
                (punto) => {

                  const creador =
                    obtenerCreador(
                      punto.usuario_id
                    )

                  const eliminando =
                    puntoEliminandoId ===
                    punto.id

                  return (

                    <motion.tr
                      key={punto.id}
                      variants={elementoVariantes}
                      initial="oculto"
                      animate="visible"
                      exit="salida"
                      className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20"
                    >

                      {/* PUNTO */}

                      <td className="px-6 py-4">

                        <div className="flex items-start gap-3">

                          <div className="w-9 h-9 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] flex items-center justify-center text-[#218739] dark:text-[#2fa350] font-black shrink-0">
                            📍
                          </div>

                          <div className="min-w-0">

                            <div className="text-sm font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                              {punto.nombre}
                            </div>

                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                              ID: {punto.id}
                            </div>

                            <p
                              className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-2 max-w-xs"
                              title={punto.descripcion}
                            >
                              {punto.descripcion}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* UBICACIÓN */}

                      <td className="px-6 py-4">

                        <div className="text-xs text-gray-800 dark:text-[#f2f5f3] font-bold">
                          {punto.direccion}
                        </div>

                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {punto.localidad}
                        </div>

                        <div className="text-[10px] text-gray-400 font-mono mt-1">
                          {Number(
                            punto.latitud
                          ).toFixed(5)}
                          {', '}
                          {Number(
                            punto.longitud
                          ).toFixed(5)}
                        </div>

                      </td>

                      {/* CATEGORÍAS */}

                      <td className="px-6 py-4">

                        <div className="flex flex-wrap gap-1.5 max-w-xs">

                          {punto.categorias?.map(
                            (
                              categoria,
                              index
                            ) => (
                              <span
                                key={`${punto.id}-${index}`}
                                className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 dark:bg-[#121816] text-gray-600 dark:text-[#b9c5c0]"
                              >
                                {categoria}
                              </span>
                            )
                          )}

                        </div>

                      </td>

                      {/* ESTADO */}

                      <td className="px-6 py-4 whitespace-nowrap">

                        <Badge
                          tipo={
                            punto.estado ===
                            'aprobado'
                              ? 'aprobado'
                              : punto.estado ===
                                'rechazado'
                                ? 'rechazado'
                                : 'pendiente'
                          }
                          texto={
                            punto.estado
                          }
                        />

                        {punto.motivo_rechazo && (
                          <p className="text-[10px] text-red-500 mt-2 max-w-xs">
                            Motivo: {punto.motivo_rechazo}
                          </p>
                        )}

                      </td>

                      {/* CREADOR */}

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

                      {/* ACCIONES */}

                      <td className="px-6 py-4 whitespace-nowrap">

                        <div className="flex items-center justify-end">

                          <LoadingButton
                            cargando={
                              eliminando
                            }
                            texto="🗑️ Eliminar"
                            textoCargando="Eliminando..."
                            variante="peligro"
                            onClick={() =>
                              eliminarPunto(
                                punto.id
                              )
                            }
                            deshabilitado={
                              puntoEliminandoId !==
                                null &&
                              !eliminando
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

) : pestañaActiva === 'entregas' ? (

  /* =====================================================
     PESTAÑA ENTREGAS
  ===================================================== */

  <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden">

    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-[#121816]/30">

      <div className="flex items-center justify-between gap-4 flex-wrap">

        <div>

          <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
            Entregas registradas
          </h3>

          <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
            Consulta las entregas realizadas por los usuarios en los puntos ecológicos.
          </p>

        </div>

        <Badge
          tipo="info"
          texto={`${entregas.length} entregas`}
        />

      </div>

    </div>

    {cargando ? (

      <div className="p-8 text-center text-sm text-gray-400">
        ⏳ Cargando entregas...
      </div>

    ) : entregas.length === 0 ? (

      <EmptyState
        titulo="No hay entregas registradas"
        descripcion="Actualmente no existen entregas registradas en el sistema."
        icono="♻️"
      />

    ) : (

      <div className="overflow-x-auto">

        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800/40">

          <thead>

            <tr className="bg-gray-50/30 dark:bg-[#121816]/30 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">

              <th className="px-6 py-4">
                Usuario
              </th>

              <th className="px-6 py-4">
                Punto ecológico
              </th>

              <th className="px-6 py-4">
                Tipo
              </th>

              <th className="px-6 py-4">
                Cantidad
              </th>

              <th className="px-6 py-4">
                Fecha
              </th>

              <th className="px-6 py-4">
                Estado
              </th>

              <th className="px-6 py-4">
                Observación
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

              {entregas.map(
                (entrega) => (

                  <motion.tr
                    key={entrega.id}
                    variants={elementoVariantes}
                    initial="oculto"
                    animate="visible"
                    exit="salida"
                    className="hover:bg-gray-50/30 dark:hover:bg-gray-800/20"
                  >

                    {/* USUARIO */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-full bg-[#f1f8f4] dark:bg-[#0f1512] flex items-center justify-center text-[#218739] dark:text-[#2fa350] font-black shrink-0">
                          {entrega.usuario_nombre
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <div className="text-xs font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                            {entrega.usuario_nombre}
                          </div>

                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {entrega.usuario_correo}
                          </div>

                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            ID: {entrega.usuario_id}
                          </div>

                        </div>

                      </div>

                    </td>

                    {/* PUNTO */}

                    <td className="px-6 py-4">

                      <div className="text-xs font-bold text-gray-800 dark:text-[#f2f5f3]">
                        📍 {entrega.punto_nombre}
                      </div>

                      <div className="text-[11px] text-gray-400 mt-1">
                        {entrega.punto_direccion}
                      </div>

                      <div className="text-[10px] text-gray-400 font-mono mt-1">
                        ID: {entrega.punto_id}
                      </div>

                    </td>

                    {/* TIPO */}

                    <td className="px-6 py-4 whitespace-nowrap">

                      {entrega.tipo === 'ropa' ? (

                        <span className="text-xs font-bold">
                          👕 Ropa
                        </span>

                      ) : entrega.tipo === 'electronicos' ? (

                        <span className="text-xs font-bold">
                          🔌 Electrónicos
                        </span>

                      ) : (

                        <span className="text-xs font-bold">
                          ♻️ Reciclaje
                        </span>

                      )}

                    </td>

                    {/* CANTIDAD */}

                    <td className="px-6 py-4 whitespace-nowrap">

                      <div className="text-sm font-black text-gray-800 dark:text-[#f2f5f3]">
                        {entrega.cantidad}
                      </div>

                      <div className="text-[10px] text-gray-400 uppercase font-bold">
                        {entrega.unidad}
                      </div>

                    </td>

                    {/* FECHA */}

                    <td className="px-6 py-4 whitespace-nowrap">

                      <div className="text-xs font-bold text-gray-700 dark:text-[#dce4e0]">
                        {new Date(
                          entrega.fecha
                        ).toLocaleDateString(
                          'es-CO'
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 mt-1">
                        {new Date(
                          entrega.fecha
                        ).toLocaleTimeString(
                          'es-CO',
                          {
                            hour: '2-digit',
                            minute: '2-digit'
                          }
                        )}
                      </div>

                    </td>

                    {/* ESTADO */}

                    <td className="px-6 py-4 whitespace-nowrap">

                      <Badge
                        tipo={
                          entrega.estado ===
                          'registrada'
                            ? 'aprobado'
                            : 'pendiente'
                        }
                        texto={
                          entrega.estado
                        }
                      />

                    </td>

                    {/* OBSERVACIÓN */}

                    <td className="px-6 py-4">

                      {entrega.observacion ? (

                        <p
                          className="text-xs text-gray-600 dark:text-[#a8b3ae] max-w-xs"
                          title={entrega.observacion}
                        >
                          {entrega.observacion}
                        </p>

                      ) : (

                        <span className="text-xs text-gray-400 italic">
                          Sin observación
                        </span>

                      )}

                    </td>

                  </motion.tr>

                )
              )}

            </AnimatePresence>

          </motion.tbody>

        </table>

      </div>

    )}

  </section>

) : pestañaActiva === 'usuarios' ? (

  /* =====================================================
     PESTAÑA USUARIOS
  ===================================================== */

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
                    usuario.id ===
                    miUsuarioId

                  const procesando =
                    usuarioProcesandoId ===
                    usuario.id

                  return (

                    <motion.tr
                      key={usuario.id}
                      variants={elementoVariantes}
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

) : pestañaActiva === 'reportes' ? (

          /* =====================================================
             PESTAÑA REPORTES
          ===================================================== */

          <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 bg-gray-50/30 dark:bg-[#121816]/30">

              <div className="flex items-center justify-between gap-4 flex-wrap">

                <div>

                  <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                    Reportes de puntos ecológicos
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                    Revisa los avisos enviados por la comunidad y registra la decisión administrativa.
                  </p>

                </div>

                <Badge
                  tipo="pendiente"
                  texto={`${reportes.filter((reporte) => (reporte.estado || 'pendiente') === 'pendiente').length} pendientes`}
                />

              </div>

            </div>

            {cargando ? (

              <div className="p-8 text-center text-sm text-gray-400">
                ⏳ Cargando reportes...
              </div>

            ) : reportes.length === 0 ? (

              <EmptyState
                titulo="No hay reportes"
                descripcion="Todavía no hay reportes registrados o la ruta de reportes no está disponible."
                icono="🚩"
              />

            ) : (

              <div className="divide-y divide-gray-100 dark:divide-gray-800/40">

                {reportes.map(
                  (reporte) => {

                    const reporteId =
                      reporte.id ??
                      reporte.reporte_id

                    const estadoReporte =
                      reporte.estado ||
                      'pendiente'

                    const pendiente =
                      estadoReporte ===
                      'pendiente'

                    const nombrePunto =
                      reporte.punto_nombre ||
                      reporte.nombre_punto ||
                      reporte.punto?.nombre ||
                      `Punto #${reporte.punto_id ?? '—'}`

                    const nombreReportante =
                      reporte.usuario_nombre ||
                      reporte.reportante_nombre ||
                      reporte.reportante?.nombre ||
                      reporte.usuario?.nombre ||
                      `Usuario #${reporte.usuario_id ?? '—'}`

                    const correoReportante =
                      reporte.usuario_correo ||
                      reporte.reportante_correo ||
                      reporte.reportante?.correo ||
                      reporte.usuario?.correo ||
                      ''

                    const motivo =
                      reporte.motivo ||
                      'Sin motivo indicado'

                    const fecha =
                      reporte.fecha_creacion ||
                      reporte.fecha ||
                      reporte.created_at

                    const fechaLegible =
                      fecha
                        ? new Date(
                            fecha
                          ).toLocaleString(
                            'es-CO',
                            {
                              dateStyle:
                                'medium',
                              timeStyle:
                                'short'
                            }
                          )
                        : 'Fecha no disponible'

                    const procesandoReporte =
                      reporteProcesandoId ===
                      reporteId

                    return (

                      <article
                        key={reporteId}
                        className="p-5 sm:p-6 space-y-4"
                      >

                        <div className="flex items-start justify-between gap-3 flex-wrap">

                          <div>

                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-[#f2f5f3]">
                              {nombrePunto}
                            </h4>

                            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">

                              Reportado por{' '}

                              <span className="font-bold">
                                {nombreReportante}
                              </span>

                              {correoReportante
                                ? ` · ${correoReportante}`
                                : ''}

                            </p>

                            <p className="text-[11px] text-gray-400 mt-1">
                              Fecha: {fechaLegible}
                            </p>

                          </div>

                          <Badge
                            tipo={
                              estadoReporte ===
                              'revisado'
                                ? 'aprobado'
                                : estadoReporte ===
                                  'descartado'
                                  ? 'rechazado'
                                  : 'pendiente'
                            }
                            texto={
                              estadoReporte
                            }
                          />

                        </div>

                        <div className="rounded-xl bg-gray-50 dark:bg-[#121816] p-4">

                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                            Motivo del reporte
                          </p>

                          <p className="text-sm text-gray-700 dark:text-[#f2f5f3] whitespace-pre-wrap break-words">
                            {motivo}
                          </p>

                        </div>

                        {reporte.observacion_admin && (

                          <div className="rounded-xl border border-gray-100 dark:border-gray-800/40 p-3">

                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                              Observación administrativa
                            </p>

                            <p className="text-xs text-gray-600 dark:text-[#a8b3ae] whitespace-pre-wrap break-words">
                              {reporte.observacion_admin}
                            </p>

                          </div>

                        )}

                        {pendiente && (

                          <div className="space-y-3">

                            <label className="block">

                              <span className="block text-xs font-bold text-gray-600 dark:text-[#a8b3ae] mb-1.5">
                                Observación administrativa (opcional)
                              </span>

                              <textarea
                                value={
                                  observacionesReportes[
                                    reporteId
                                  ] || ''
                                }
                                onChange={(
                                  evento
                                ) =>
                                  setObservacionesReportes(
                                    (
                                      actuales
                                    ) => ({
                                      ...actuales,
                                      [reporteId]:
                                        evento
                                          .target
                                          .value
                                    })
                                  )
                                }
                                rows={2}
                                maxLength={1000}
                                placeholder="Añade una nota sobre la decisión, si es necesario..."
                                disabled={
                                  procesandoReporte
                                }
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f1512] text-sm text-gray-800 dark:text-[#f2f5f3] placeholder:text-gray-400 p-3 outline-none focus:ring-2 focus:ring-[#218739]/30 focus:border-[#218739] disabled:opacity-50"
                              />

                            </label>

                            <div className="flex flex-wrap justify-end gap-2">

                              <LoadingButton
                                cargando={
                                  procesandoReporte
                                }
                                texto="Marcar como revisado"
                                textoCargando="Guardando..."
                                variante="primario"
                                onClick={() =>
                                  revisarReporte(
                                    reporteId,
                                    'revisado'
                                  )
                                }
                                deshabilitado={
                                  reporteId ==
                                    null ||
                                  reporteProcesandoId !==
                                    null
                                }
                              />

                              <LoadingButton
                                cargando={
                                  procesandoReporte
                                }
                                texto="Descartar reporte"
                                textoCargando="Guardando..."
                                variante="peligro"
                                onClick={() =>
                                  revisarReporte(
                                    reporteId,
                                    'descartado'
                                  )
                                }
                                deshabilitado={
                                  reporteId ==
                                    null ||
                                  reporteProcesandoId !==
                                    null
                                }
                              />

                            </div>

                          </div>

                        )}

                      </article>

                    )
                  }
                )}

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

                                <div className="mt-1.5">
                                  <CategoriasBadges
                                    categorias={
                                      punto.categorias
                                    }
                                  />
                                </div>

                              </td>

                              <td className="px-6 py-4">

                                <p
                                  className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-xs"
                                  title={
                                    punto.descripcion
                                  }
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
                    🟢 Aprobados:{' '}
                    <strong>
                      {puntosAprobados.length}
                    </strong>{' '}
                    ({porcentajeAprobados}%)
                  </span>

                  <span>
                    🟡 Pendientes:{' '}
                    <strong>
                      {puntosPendientes.length}
                    </strong>{' '}
                    ({porcentajePendientes}%)
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

