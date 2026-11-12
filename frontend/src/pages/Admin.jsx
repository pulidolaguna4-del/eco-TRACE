// =========================================================
// PANEL DE ADMINISTRACIÓN
// =========================================================
// - Barra lateral (como el panel del mapa) con las bandejas de
//   moderación y gestión; en pantallas pequeñas se vuelve una tira
//   horizontal desplazable.
// - Resumen con las tareas pendientes e indicadores.
// - Cada sección vive en components/admin. Aquí quedan el estado y
//   las llamadas a la API.
// - Los avisos de éxito y error flotan abajo a la derecha y las
//   eliminaciones se confirman en un modal.

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { normalizarPunto, formatearMensajeError } from '../utils/puntoUtils'
import { anilloFoco, Avatar, Avisos, BotonAccion, ModalConfirmacion, ModalRechazo } from '../components/admin/ui'
import SeccionResumen from '../components/admin/SeccionResumen'
import SeccionPendientes from '../components/admin/SeccionPendientes'
import SeccionPuntos from '../components/admin/SeccionPuntos'
import SeccionEntregas from '../components/admin/SeccionEntregas'
import SeccionUsuarios from '../components/admin/SeccionUsuarios'
import SeccionReportes from '../components/admin/SeccionReportes'

const API_URL = 'http://127.0.0.1:8000'

const GRUPOS = [
  {
    nombre: 'General',
    secciones: [{ id: 'resumen', texto: 'Resumen', icono: '📊' }]
  },
  {
    nombre: 'Moderación',
    secciones: [
      { id: 'pendientes', texto: 'Puntos por aprobar', icono: '⏳' },
      { id: 'entregas', texto: 'Entregas', icono: '♻️' },
      { id: 'reportes', texto: 'Reportes', icono: '🚩' }
    ]
  },
  {
    nombre: 'Gestión',
    secciones: [
      { id: 'puntos', texto: 'Todos los puntos', icono: '📍' },
      { id: 'usuarios', texto: 'Usuarios', icono: '👥' }
    ]
  }
]

const ENCABEZADOS = {
  resumen: { grupo: 'Panel de administración', titulo: 'Resumen', texto: 'Lo que pasa en eco-TRACE y lo que espera tu revisión.' },
  pendientes: { grupo: 'Moderación', titulo: 'Puntos por aprobar', texto: 'Revisa cada propuesta antes de publicarla en el mapa. Quien la envió recibe un correo con tu decisión.' },
  entregas: { grupo: 'Moderación', titulo: 'Entregas', texto: 'Verifica las entregas y donaciones. Solo las verificadas suman al impacto.' },
  reportes: { grupo: 'Moderación', titulo: 'Reportes', texto: 'Avisos de la comunidad sobre información incorrecta de un punto.' },
  puntos: { grupo: 'Gestión', titulo: 'Todos los puntos', texto: 'Consulta todos los puntos ecológicos y atiende los que están en revisión prioritaria.' },
  usuarios: { grupo: 'Gestión', titulo: 'Usuarios', texto: 'Administra las cuentas y los permisos de administrador.' }
}

function leerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch {
    return null
  }
}

// =========================================================
// BARRA LATERAL
// =========================================================

function BarraLateral({ usuario, seccion, onSeccion, contadores }) {
  const reducido = useReducedMotion()

  return (
    <aside className="lg:w-64 shrink-0 lg:sticky lg:top-24 lg:self-start space-y-5">
      {/* Tarjeta del administrador (escritorio) */}
      <div className="hidden lg:flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/60 shadow-xs">
        <Avatar nombre={usuario?.nombre} admin />
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{usuario?.nombre}</p>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">👑 Administración</p>
        </div>
      </div>

      <nav aria-label="Secciones del panel" className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex lg:flex-col gap-1 lg:gap-6 w-max lg:w-auto pb-1 lg:pb-0">
          {GRUPOS.map((grupo) => (
            <div key={grupo.nombre} className="flex lg:flex-col gap-1">
              <p className="hidden lg:block px-3 mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500 dark:text-[#a8b3ae]">
                {grupo.nombre}
              </p>
              {grupo.secciones.map((s) => {
                const activo = seccion === s.id
                const contador = contadores[s.id]
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSeccion(s.id)}
                    aria-current={activo ? 'page' : undefined}
                    className={`relative shrink-0 flex items-center gap-3 min-h-11 px-3.5 lg:px-3 rounded-xl text-sm font-bold whitespace-nowrap cursor-pointer transition-colors ${anilloFoco} ${
                      activo
                        ? 'text-[#176b2b] dark:text-[#2fa350]'
                        : 'text-gray-600 dark:text-[#a8b3ae] hover:text-gray-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-[#1a2320]/60'
                    }`}
                  >
                    {activo && (
                      <motion.span
                        layoutId="admin-seccion-activa"
                        transition={reducido ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-white dark:bg-[#1a2320] border border-[#218739]/15 dark:border-gray-800/60 shadow-xs"
                      />
                    )}
                    <span className="relative text-base" aria-hidden="true">{s.icono}</span>
                    <span className="relative lg:flex-1 text-left">{s.texto}</span>
                    {contador?.valor > 0 && (
                      <span
                        className={`relative min-w-6 h-6 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center tabular-nums ${
                          contador.tono === 'red' ? 'bg-red-600 text-white' : contador.tono === 'amber' ? 'bg-amber-400 text-amber-950' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-[#dce4e0]'
                        }`}
                      >
                        {contador.valor}
                        <span className="sr-only"> {contador.descripcion}</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}

// =========================================================
// ADMIN
// =========================================================

function Admin() {
  const navigate = useNavigate()
  const reducido = useReducedMotion()
  const usuarioSesion = leerUsuario()

  // Datos
  const [puntosPendientes, setPuntosPendientes] = useState([])
  const [todosLosPuntos, setTodosLosPuntos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [entregas, setEntregas] = useState([])
  const [reportes, setReportes] = useState([])

  // Sesión y carga
  const [esAdmin, setEsAdmin] = useState(false)
  const [miUsuarioId, setMiUsuarioId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // Procesos en curso
  const [procesandoId, setProcesandoId] = useState(null)
  const [puntoEliminandoId, setPuntoEliminandoId] = useState(null)
  const [puntoRevisandoId, setPuntoRevisandoId] = useState(null)
  const [entregaProcesandoId, setEntregaProcesandoId] = useState(null)
  const [reporteProcesandoId, setReporteProcesandoId] = useState(null)
  const [usuarioProcesandoId, setUsuarioProcesandoId] = useState(null)

  // Modales
  const [puntoARechazar, setPuntoARechazar] = useState(null)
  const [entregaARechazar, setEntregaARechazar] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null) // { tipo: 'punto' | 'usuario', elemento }

  // Navegación, filtros y búsquedas
  // La sección va en la URL (?seccion=reportes) para que "atrás" vuelva a ella
  const [parametros, setParametros] = useSearchParams()
  const seccion = ENCABEZADOS[parametros.get('seccion')] ? parametros.get('seccion') : 'resumen'
  const setSeccion = (destino) =>
    setParametros(destino === 'resumen' ? {} : { seccion: destino }, { replace: true })
  const [filtroPuntos, setFiltroPuntos] = useState('todos')
  const [busquedaPuntos, setBusquedaPuntos] = useState('')
  const [filtroEntregas, setFiltroEntregas] = useState('todas')
  const [busquedaEntregas, setBusquedaEntregas] = useState('')
  const [filtroUsuarios, setFiltroUsuarios] = useState('todos')
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [filtroReportes, setFiltroReportes] = useState('pendiente')
  const [observacionesReportes, setObservacionesReportes] = useState({})

  const obtenerCreador = (usuarioId) => usuarios.find((u) => u.id === usuarioId)

  // Los avisos de éxito se ocultan solos
  useEffect(() => {
    if (!mensaje) return
    const id = setTimeout(() => setMensaje(''), 4500)
    return () => clearTimeout(id)
  }, [mensaje])

  const avisar = (texto) => {
    setError('')
    setMensaje(texto)
  }

  const fallar = (texto) => {
    setMensaje('')
    setError(texto)
  }

  // =========================================================
  // PETICIONES
  // =========================================================

  const peticion = async (ruta, { metodo = 'GET', cuerpo } = {}) => {
    const token = localStorage.getItem('access_token')
    if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')

    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(cuerpo !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      ...(cuerpo !== undefined ? { body: JSON.stringify(cuerpo) } : {})
    })
    const datos = await respuesta.json().catch(() => null)
    return { respuesta, datos }
  }

  // =========================================================
  // CARGAR DATOS
  // =========================================================

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError('')

    try {
      const [pendientes, listaUsuarios, puntos, listaReportes, listaEntregas] = await Promise.all([
        peticion('/admin/puntos/pendientes'),
        peticion('/admin/usuarios'),
        peticion('/admin/puntos'),
        peticion('/admin/reportes').catch((e) => ({ fallo: e })),
        peticion('/admin/entregas').catch((e) => ({ fallo: e }))
      ])

      // Obligatorios: sin ellos el panel no sirve
      for (const [r, texto] of [
        [pendientes, 'los puntos pendientes'],
        [listaUsuarios, 'los usuarios'],
        [puntos, 'los puntos']
      ]) {
        if (r.respuesta.status === 401 || r.respuesta.status === 403) {
          throw new Error('Tu sesión no tiene permisos de administrador. Vuelve a iniciar sesión.')
        }
        if (!r.respuesta.ok) {
          throw new Error(formatearMensajeError(r.datos?.detail, `No se pudieron cargar ${texto}.`))
        }
      }

      setPuntosPendientes(pendientes.datos.map(normalizarPunto))
      setUsuarios(listaUsuarios.datos)
      setTodosLosPuntos(puntos.datos.map(normalizarPunto))

      // Opcionales: si fallan, el resto del panel sigue funcionando
      const avisos = []

      if (listaReportes.respuesta?.ok && Array.isArray(listaReportes.datos)) {
        setReportes(listaReportes.datos)
      } else {
        setReportes([])
        avisos.push(formatearMensajeError(listaReportes.datos?.detail, 'No se pudieron cargar los reportes.'))
      }

      if (listaEntregas.respuesta?.ok && Array.isArray(listaEntregas.datos)) {
        setEntregas(listaEntregas.datos)
      } else {
        setEntregas([])
        avisos.push(formatearMensajeError(listaEntregas.datos?.detail, 'No se pudieron cargar las entregas.'))
      }

      if (avisos.length) setError(avisos.join(' '))
      setUltimaActualizacion(new Date())
    } catch (err) {
      console.error('Error cargando el panel:', err)
      setError(err.message || 'No pudimos conectar con el servidor.')
    } finally {
      setCargando(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Verificar que la sesión sea de un administrador
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token || !usuarioSesion) {
      setError('Inicia sesión con una cuenta de administrador para entrar al panel.')
      setCargando(false)
      return
    }

    setMiUsuarioId(usuarioSesion.id)

    if (!usuarioSesion.es_admin) {
      setError('Tu cuenta no tiene permisos de administrador.')
      setCargando(false)
      return
    }

    setEsAdmin(true)
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =========================================================
  // APROBAR / RECHAZAR PUNTO
  // =========================================================

  // Devuelve true si el cambio se guardó
  const cambiarEstado = async (puntoId, accion, motivoRechazo = null) => {
    try {
      setProcesandoId(puntoId)

      const { respuesta, datos } = await peticion(
        `/admin/puntos/${puntoId}/${accion}`,
        { metodo: 'PUT', cuerpo: motivoRechazo ? { motivo_rechazo: motivoRechazo } : undefined }
      )

      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo procesar el punto.'))

      const anterior = puntosPendientes.find((p) => p.id === puntoId)
      const actualizado = datos
        ? normalizarPunto(datos)
        : { ...anterior, estado: accion === 'aprobar' ? 'aprobado' : 'rechazado', motivo_rechazo: motivoRechazo }

      setTodosLosPuntos((actuales) => {
        const existe = actuales.some((p) => p.id === puntoId)
        return existe ? actuales.map((p) => (p.id === puntoId ? actualizado : p)) : [...actuales, actualizado]
      })
      setPuntosPendientes((actuales) => actuales.filter((p) => p.id !== puntoId))

      avisar(
        accion === 'aprobar'
          ? `"${actualizado.nombre}" ya está publicado en el mapa.`
          : `Rechazaste "${actualizado.nombre}". Le avisaremos por correo a quien lo propuso.`
      )
      return true
    } catch (err) {
      console.error('Error cambiando el estado del punto:', err)
      fallar(err.message)
      return false
    } finally {
      setProcesandoId(null)
    }
  }

  const confirmarRechazo = async (motivo) => {
    if (!puntoARechazar) return
    if (await cambiarEstado(puntoARechazar.id, 'rechazar', motivo)) setPuntoARechazar(null)
  }

  // =========================================================
  // MARCAR COMO REVISADO UN PUNTO SEÑALADO POR RESEÑAS
  // =========================================================

  const marcarPuntoRevisado = async (puntoId) => {
    try {
      setPuntoRevisandoId(puntoId)

      const { respuesta, datos } = await peticion(`/admin/puntos/${puntoId}/revision`, { metodo: 'PUT' })
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo marcar el punto como revisado.'))

      const actualizado = normalizarPunto(datos)
      setTodosLosPuntos((actuales) => actuales.map((p) => (p.id === puntoId ? actualizado : p)))
      avisar(`"${actualizado.nombre}" quedó marcado como revisado.`)
    } catch (err) {
      console.error(err)
      fallar(err.message)
    } finally {
      setPuntoRevisandoId(null)
    }
  }

  // =========================================================
  // ELIMINAR PUNTO (tras confirmar en el modal)
  // =========================================================

  const eliminarPunto = async (puntoId) => {
    try {
      setPuntoEliminandoId(puntoId)

      const { respuesta, datos } = await peticion(`/admin/puntos/${puntoId}`, { metodo: 'DELETE' })
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo eliminar el punto.'))

      setTodosLosPuntos((actuales) => actuales.filter((p) => p.id !== puntoId))
      setPuntosPendientes((actuales) => actuales.filter((p) => p.id !== puntoId))
      setReportes((actuales) => actuales.filter((r) => r.punto_id !== puntoId))
      setEntregas((actuales) => actuales.filter((e) => e.punto_id !== puntoId))

      avisar(datos?.mensaje || 'Eliminaste el punto.')
      return true
    } catch (err) {
      console.error('Error eliminando el punto:', err)
      fallar(err.message)
      return false
    } finally {
      setPuntoEliminandoId(null)
    }
  }

  // =========================================================
  // VERIFICAR / RECHAZAR ENTREGA
  // =========================================================

  const revisarEntrega = async (entregaId, estado, observacion = null) => {
    try {
      setEntregaProcesandoId(entregaId)

      const { respuesta, datos } = await peticion(`/admin/entregas/${entregaId}/revisar`, {
        metodo: 'PUT',
        cuerpo: { estado, observacion_admin: observacion }
      })
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo actualizar la entrega.'))

      setEntregas((actuales) => actuales.map((e) => (e.id === entregaId ? datos : e)))
      avisar(estado === 'verificada' ? 'Verificaste la entrega. Ya suma al impacto.' : 'Rechazaste la entrega. El usuario verá el motivo en su historial.')
      return true
    } catch (err) {
      console.error(err)
      fallar(err.message)
      return false
    } finally {
      setEntregaProcesandoId(null)
    }
  }

  const confirmarRechazoEntrega = async (motivo) => {
    if (!entregaARechazar) return
    if (await revisarEntrega(entregaARechazar.id, 'rechazada', motivo)) setEntregaARechazar(null)
  }

  // =========================================================
  // REVISAR / DESCARTAR REPORTE
  // =========================================================

  const revisarReporte = async (reporteId, estado) => {
    if (!['revisado', 'descartado'].includes(estado)) {
      fallar('El estado solicitado para el reporte no es válido.')
      return
    }

    const observacion = (observacionesReportes[reporteId] || '').trim() || null

    try {
      setReporteProcesandoId(reporteId)

      const { respuesta, datos } = await peticion(`/admin/reportes/${reporteId}/revisar`, {
        metodo: 'PUT',
        cuerpo: { estado, observacion_admin: observacion }
      })
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo actualizar el reporte.'))

      setReportes((actuales) =>
        actuales.map((r) =>
          (r.id ?? r.reporte_id) === reporteId
            ? { ...r, ...(datos && typeof datos === 'object' ? datos : {}), estado, observacion_admin: observacion }
            : r
        )
      )
      setObservacionesReportes(({ [reporteId]: _quitada, ...resto }) => resto)

      avisar(estado === 'revisado' ? 'Marcaste el reporte como revisado.' : 'Descartaste el reporte.')
    } catch (err) {
      console.error('Error revisando el reporte:', err)
      fallar(err.message)
    } finally {
      setReporteProcesandoId(null)
    }
  }

  // =========================================================
  // CAMBIAR ROL DE ADMINISTRADOR
  // =========================================================

  const cambiarAdministrador = async (usuarioId) => {
    if (usuarioId === miUsuarioId) {
      fallar('No puedes cambiar tus propios permisos de administrador.')
      return
    }

    try {
      setUsuarioProcesandoId(usuarioId)

      const { respuesta, datos } = await peticion(`/admin/usuarios/${usuarioId}/admin`, { metodo: 'PUT' })
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudieron cambiar los permisos.'))

      setUsuarios((actuales) => actuales.map((u) => (u.id === usuarioId ? datos : u)))
      avisar(
        datos.es_admin
          ? `${datos.nombre} ahora es administrador. El cambio se aplica cuando vuelva a iniciar sesión.`
          : `${datos.nombre} ya no es administrador. El cambio se aplica cuando vuelva a iniciar sesión.`
      )
    } catch (err) {
      console.error(err)
      fallar(err.message)
    } finally {
      setUsuarioProcesandoId(null)
    }
  }

  // =========================================================
  // ELIMINAR USUARIO (tras confirmar en el modal)
  // =========================================================

  const eliminarUsuario = async (usuarioId) => {
    if (usuarioId === miUsuarioId) {
      fallar('No puedes eliminar tu propia cuenta.')
      return false
    }

    try {
      setUsuarioProcesandoId(usuarioId)

      const { respuesta, datos } = await peticion(`/admin/usuarios/${usuarioId}`, { metodo: 'DELETE' })
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo eliminar el usuario.'))

      setUsuarios((actuales) => actuales.filter((u) => u.id !== usuarioId))
      setPuntosPendientes((actuales) => actuales.filter((p) => p.usuario_id !== usuarioId))
      setTodosLosPuntos((actuales) => actuales.filter((p) => p.usuario_id !== usuarioId))
      setEntregas((actuales) => actuales.filter((e) => e.usuario_id !== usuarioId))
      setReportes((actuales) =>
        actuales.filter((r) => (r.usuario_id ?? r.reportante_id ?? r.usuario?.id ?? r.reportante?.id) !== usuarioId)
      )

      avisar('Eliminaste la cuenta.')
      return true
    } catch (err) {
      console.error(err)
      fallar(err.message)
      return false
    } finally {
      setUsuarioProcesandoId(null)
    }
  }

  const confirmarEliminacion = async () => {
    if (!confirmacion) return
    const { tipo, elemento } = confirmacion
    const hecho = tipo === 'punto' ? await eliminarPunto(elemento.id) : await eliminarUsuario(elemento.id)
    if (hecho) setConfirmacion(null)
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  const irA = (destino, filtro) => {
    setSeccion(destino)
    if (filtro) {
      if (destino === 'puntos') setFiltroPuntos(filtro)
      if (destino === 'entregas') setFiltroEntregas(filtro)
      if (destino === 'reportes') setFiltroReportes(filtro)
    }
    window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' })
  }

  const entregasPendientes = entregas.filter((e) => e.estado === 'pendiente').length
  const reportesPendientes = reportes.filter((r) => (r.estado || 'pendiente') === 'pendiente').length
  const prioritarios = todosLosPuntos.filter((p) => p.revision_prioritaria).length

  const contadores = {
    pendientes: { valor: puntosPendientes.length, tono: 'amber', descripcion: 'por aprobar' },
    entregas: { valor: entregasPendientes, tono: 'amber', descripcion: 'por verificar' },
    reportes: { valor: reportesPendientes, tono: 'red', descripcion: 'abiertos' },
    puntos: { valor: prioritarios, tono: 'amber', descripcion: 'en revisión prioritaria' },
    usuarios: { valor: usuarios.length, tono: 'gris', descripcion: 'en total' }
  }

  // =========================================================
  // ACCESO RESTRINGIDO
  // =========================================================

  if (!cargando && !esAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f1f8f4] dark:bg-[#0f1512] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/60 rounded-3xl shadow-xl p-8 sm:p-10">
          <span className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-3xl" aria-hidden="true">
            🔒
          </span>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">Panel de administración</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white">Acceso restringido</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-[#a8b3ae]">{error || 'Solo los administradores pueden entrar a este panel.'}</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
            <BotonAccion onClick={() => navigate('/home')}>Volver al inicio</BotonAccion>
            <BotonAccion variante="primario" onClick={() => navigate('/login')}>Iniciar sesión</BotonAccion>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================
  // PANEL
  // =========================================================

  const encabezado = ENCABEZADOS[seccion]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f1f8f4] dark:bg-[#0f1512] text-gray-800 dark:text-[#f2f5f3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col lg:flex-row gap-6 lg:gap-10">
        <BarraLateral usuario={usuarioSesion} seccion={seccion} onSeccion={irA} contadores={contadores} />

        <main className="flex-1 min-w-0">
          {/* ENCABEZADO DE LA SECCIÓN */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">{encabezado.grupo}</p>
              <h1 className="mt-1.5 text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">{encabezado.titulo}</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-[#a8b3ae] max-w-2xl">{encabezado.texto}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {ultimaActualizacion && (
                <p className="hidden md:block text-xs text-gray-500 dark:text-[#a8b3ae]">
                  Actualizado a las {ultimaActualizacion.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              <BotonAccion variante="secundario" onClick={cargarDatos} cargando={cargando} textoCargando="Actualizando..." className="bg-white dark:bg-[#1a2320] border border-gray-200 dark:border-gray-800/60">
                <span aria-hidden="true">↻</span> Actualizar
              </BotonAccion>
            </div>
          </header>

          {/* CONTENIDO */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={seccion}
              initial={reducido ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducido ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {seccion === 'resumen' && (
                <SeccionResumen
                  nombreAdmin={usuarioSesion?.nombre}
                  usuarios={usuarios}
                  todosLosPuntos={todosLosPuntos}
                  puntosPendientes={puntosPendientes}
                  entregas={entregas}
                  reportes={reportes}
                  cargando={cargando}
                  irA={irA}
                />
              )}

              {seccion === 'pendientes' && (
                <SeccionPendientes
                  puntosPendientes={puntosPendientes}
                  obtenerCreador={obtenerCreador}
                  procesandoId={procesandoId}
                  onAprobar={(id) => cambiarEstado(id, 'aprobar')}
                  onRechazar={setPuntoARechazar}
                  cargando={cargando}
                />
              )}

              {seccion === 'entregas' && (
                <SeccionEntregas
                  entregas={entregas}
                  filtro={filtroEntregas}
                  onFiltro={setFiltroEntregas}
                  busqueda={busquedaEntregas}
                  onBusqueda={setBusquedaEntregas}
                  entregaProcesandoId={entregaProcesandoId}
                  onVerificar={(id) => revisarEntrega(id, 'verificada')}
                  onRechazar={setEntregaARechazar}
                  cargando={cargando}
                />
              )}

              {seccion === 'reportes' && (
                <SeccionReportes
                  reportes={reportes}
                  filtro={filtroReportes}
                  onFiltro={setFiltroReportes}
                  observaciones={observacionesReportes}
                  onObservacion={(id, texto) => setObservacionesReportes((actuales) => ({ ...actuales, [id]: texto }))}
                  reporteProcesandoId={reporteProcesandoId}
                  onRevisar={revisarReporte}
                  cargando={cargando}
                />
              )}

              {seccion === 'puntos' && (
                <SeccionPuntos
                  todosLosPuntos={todosLosPuntos}
                  obtenerCreador={obtenerCreador}
                  filtro={filtroPuntos}
                  onFiltro={setFiltroPuntos}
                  busqueda={busquedaPuntos}
                  onBusqueda={setBusquedaPuntos}
                  puntoEliminandoId={puntoEliminandoId}
                  puntoRevisandoId={puntoRevisandoId}
                  onEliminar={(punto) => setConfirmacion({ tipo: 'punto', elemento: punto })}
                  onMarcarRevisado={marcarPuntoRevisado}
                  cargando={cargando}
                />
              )}

              {seccion === 'usuarios' && (
                <SeccionUsuarios
                  usuarios={usuarios}
                  todosLosPuntos={todosLosPuntos}
                  entregas={entregas}
                  miUsuarioId={miUsuarioId}
                  filtro={filtroUsuarios}
                  onFiltro={setFiltroUsuarios}
                  busqueda={busquedaUsuarios}
                  onBusqueda={setBusquedaUsuarios}
                  usuarioProcesandoId={usuarioProcesandoId}
                  onCambiarAdmin={cambiarAdministrador}
                  onEliminar={(usuario) => setConfirmacion({ tipo: 'usuario', elemento: usuario })}
                  cargando={cargando}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* AVISOS */}
      <Avisos mensaje={mensaje} error={error} onCerrarMensaje={() => setMensaje('')} onCerrarError={() => setError('')} />

      {/* MODAL: RECHAZAR PUNTO */}
      <AnimatePresence>
        {puntoARechazar && (
          <ModalRechazo
            key={`punto-${puntoARechazar.id}`}
            elemento={puntoARechazar}
            procesando={procesandoId === puntoARechazar.id}
            onCancelar={() => setPuntoARechazar(null)}
            onConfirmar={confirmarRechazo}
          />
        )}
      </AnimatePresence>

      {/* MODAL: RECHAZAR ENTREGA */}
      <AnimatePresence>
        {entregaARechazar && (
          <ModalRechazo
            key={`entrega-${entregaARechazar.id}`}
            elemento={{
              nombre: `Entrega #${entregaARechazar.id} · ${entregaARechazar.usuario_nombre}`,
              direccion: entregaARechazar.punto_nombre
            }}
            procesando={entregaProcesandoId === entregaARechazar.id}
            onCancelar={() => setEntregaARechazar(null)}
            onConfirmar={confirmarRechazoEntrega}
            titulo="Rechazar entrega"
            subtitulo="El usuario verá este motivo en su historial de entregas."
            etiqueta="Entrega seleccionada"
            textoConfirmar="Rechazar entrega"
            placeholder="Ej.: la cantidad registrada no coincide con lo recibido en el punto."
          />
        )}
      </AnimatePresence>

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      <AnimatePresence>
        {confirmacion && (
          <ModalConfirmacion
            key={`${confirmacion.tipo}-${confirmacion.elemento.id}`}
            titulo={confirmacion.tipo === 'punto' ? '¿Eliminar este punto?' : '¿Eliminar esta cuenta?'}
            etiqueta={confirmacion.tipo === 'punto' ? 'Punto' : 'Usuario'}
            nombre={confirmacion.elemento.nombre}
            detalle={confirmacion.tipo === 'punto' ? confirmacion.elemento.direccion && `📍 ${confirmacion.elemento.direccion}` : confirmacion.elemento.correo}
            descripcion={
              confirmacion.tipo === 'punto'
                ? 'También se eliminarán sus reseñas, reportes, entregas y categorías asociadas.'
                : 'También se eliminarán los puntos y las entregas de esta persona.'
            }
            textoConfirmar={confirmacion.tipo === 'punto' ? 'Eliminar punto' : 'Eliminar cuenta'}
            procesando={confirmacion.tipo === 'punto' ? puntoEliminandoId === confirmacion.elemento.id : usuarioProcesandoId === confirmacion.elemento.id}
            onCancelar={() => setConfirmacion(null)}
            onConfirmar={confirmarEliminacion}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Admin
