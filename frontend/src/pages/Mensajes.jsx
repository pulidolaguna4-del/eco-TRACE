// =========================================================
// MENSAJES: CHATS DE REGALOS EN TIEMPO REAL (HU-26)
// =========================================================
// - Bandeja a la izquierda y conversación a la derecha. En el celular
//   se ve una cosa a la vez (la conversación abierta va en ?c=<id>).
// - Los mensajes llegan por Socket.IO (ChatContext). Al reconectarse
//   se vuelve a pedir todo por REST, así no se pierde nada.
// - "Escribiendo…", leídos (✓✓), avisos del sistema, mensajes
//   anteriores bajo demanda y reporte de mensajes.
// - Si el regalo ya no está disponible, el chat queda en solo lectura.

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { anilloFoco, Avatar, Avisos, EstadoVacio, FiltroChips } from '../components/admin/ui'
import { haceCuanto } from '../components/admin/utilidades'
import { ModalReporte } from '../components/regalos/modales'
import { claseBotonPrincipal, claseFondo, FotoRegalo, InsigniaRegalo } from '../components/regalos/piezas'
import { useChat, useEventoChat } from '../context/ChatContext'
import { api, CONSEJOS_SEGURIDAD, LIMITES_REGALO, leerSesion } from '../utils/regalos'

const FILTROS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'regalo', nombre: 'Lo que regalo' },
  { id: 'pido', nombre: 'Lo que pido' }
]

const MOTIVO_CIERRE = {
  entregado: 'el regalo ya fue entregado',
  cancelado: 'quien lo publicó ya no lo está regalando',
  vencido: 'la publicación venció',
  oculto: 'un administrador ocultó la publicación'
}

// ---------------------------------------------------------
// Utilidades
// ---------------------------------------------------------

function hora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}

function etiquetaDia(fecha) {
  const d = new Date(fecha)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function agregarSinRepetir(lista, mensaje) {
  return lista.some((m) => m.id === mensaje.id) ? lista : [...lista, mensaje]
}

// Un mensaje cuenta como no leído para mí si lo envió otra persona
// (los avisos del sistema van a nombre de quien los causó)
function esParaMi(mensaje, miId) {
  return mensaje.remitente_id == null || mensaje.remitente_id !== miId
}

// ---------------------------------------------------------
// Bandeja
// ---------------------------------------------------------

function ElementoBandeja({ conversacion, activa, miId }) {
  const ultimo = conversacion.ultimo_mensaje
  const prefijo = ultimo && ultimo.tipo === 'usuario' && ultimo.remitente_id === miId ? 'Tú: ' : ''
  const cerrada = !conversacion.abierta

  return (
    <li>
      <Link
        to={`/mensajes?c=${conversacion.id}`}
        aria-current={activa ? 'true' : undefined}
        className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${anilloFoco} ${
          activa ? 'bg-[#218739]/10 dark:bg-[#2fa350]/15' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
        }`}
      >
        <div className="relative shrink-0">
          <FotoRegalo ruta={conversacion.regalo.foto} alt="" className={`w-12 h-12 rounded-xl text-xl ${cerrada ? 'opacity-60' : ''}`} />
          <span className="absolute -bottom-1 -right-1">
            <Avatar nombre={conversacion.otro.nombre} tamaño="sm" />
          </span>
        </div>
        <div className="flex-1 min-w-0 pl-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`text-sm truncate ${conversacion.no_leidos ? 'font-black text-gray-900 dark:text-white' : 'font-bold text-gray-800 dark:text-[#f2f5f3]'}`}>
              {conversacion.otro.nombre}
            </p>
            <span className="text-[11px] text-gray-500 dark:text-[#a8b3ae] shrink-0">{haceCuanto(conversacion.fecha_ultimo_mensaje)}</span>
          </div>
          <p className="text-xs font-semibold text-gray-600 dark:text-[#a8b3ae] truncate">
            {conversacion.soy_dueno ? '🎁 ' : '🙋 '}
            {conversacion.regalo.titulo}
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs truncate ${conversacion.no_leidos ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#a8b3ae]'}`}>
              {ultimo ? `${prefijo}${ultimo.texto}` : 'Sin mensajes'}
            </p>
            {conversacion.no_leidos > 0 && (
              <span className="min-w-5 h-5 px-1.5 shrink-0 rounded-full bg-[#218739] dark:bg-[#2fa350] text-white text-[11px] font-black flex items-center justify-center tabular-nums">
                {conversacion.no_leidos}
                <span className="sr-only"> sin leer</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

// ---------------------------------------------------------
// Mensajes
// ---------------------------------------------------------

function Burbuja({ mensaje, mio, onReportar }) {
  if (mensaje.tipo === 'sistema') {
    return (
      <li className="flex justify-center py-1">
        <p className="max-w-[85%] text-center text-xs font-semibold text-gray-600 dark:text-[#a8b3ae] bg-white/80 dark:bg-[#1a2320]/80 border border-gray-100 dark:border-gray-800/60 rounded-full px-3.5 py-1.5">
          {mensaje.texto}
        </p>
      </li>
    )
  }

  return (
    <li className={`group flex items-end gap-1.5 ${mio ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 shadow-2xs ${
          mio
            ? 'bg-[#176b2b] dark:bg-[#218739] text-white rounded-br-md'
            : 'bg-white dark:bg-[#1a2320] text-gray-900 dark:text-[#f2f5f3] border border-gray-100 dark:border-gray-800/60 rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{mensaje.texto}</p>
        <p className={`mt-0.5 text-[10px] text-right ${mio ? 'text-white/75' : 'text-gray-500 dark:text-[#a8b3ae]'}`}>
          {hora(mensaje.fecha)}
          {mio && (
            <span className="ml-1" aria-label={mensaje.leido_en ? 'Leído' : 'Enviado'}>
              {mensaje.leido_en ? '✓✓' : '✓'}
            </span>
          )}
        </p>
      </div>
      {!mio && (
        <button
          type="button"
          onClick={() => onReportar(mensaje)}
          className={`w-8 h-8 shrink-0 rounded-full text-xs opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-opacity ${anilloFoco}`}
          aria-label="Reportar este mensaje"
          title="Reportar este mensaje"
        >
          🚩
        </button>
      )}
    </li>
  )
}

function ConsejosSeguridad() {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-4 text-xs text-amber-900 dark:text-amber-200">
      <p className="font-extrabold">🛡️ Para una entrega segura</p>
      <ul className="mt-1.5 space-y-1">
        {CONSEJOS_SEGURIDAD.map((c) => (
          <li key={c}>• {c}</li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------
// Página
// ---------------------------------------------------------

function Mensajes() {
  const sesion = leerSesion()
  const miId = sesion?.usuario?.id ?? null
  const { conectado, enviarMensaje, marcarLeidos, avisarEscribiendo } = useChat()

  const [parametros, setParametros] = useSearchParams()
  const activaId = Number.parseInt(parametros.get('c'), 10) || null

  const [conversaciones, setConversaciones] = useState([])
  const [cargandoLista, setCargandoLista] = useState(true)
  const [errorLista, setErrorLista] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const [chat, setChat] = useState(null) // { conversacion, mensajes, hay_mas }
  const [cargandoChat, setCargandoChat] = useState(false)
  const [errorChat, setErrorChat] = useState('')
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false)

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [escribiendo, setEscribiendo] = useState(false)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [reportando, setReportando] = useState(null) // mensaje
  const [enviandoReporte, setEnviandoReporte] = useState(false)

  const refLista = useRef(null)
  const refTexto = useRef(null)
  const refTemporizador = useRef(null)
  const refUltimoAviso = useRef(0)
  const refAlFinal = useRef(true) // ¿la vista está pegada al último mensaje?
  const refAltoAntes = useRef(null) // para conservar la posición al cargar anteriores
  const refActiva = useRef(activaId)
  const refConversaciones = useRef(conversaciones)

  useEffect(() => {
    refActiva.current = activaId
  }, [activaId])

  useEffect(() => {
    refConversaciones.current = conversaciones
  }, [conversaciones])

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(''), 4000)
    return () => clearTimeout(t)
  }, [mensaje])

  // ---------------------------------------------------------
  // Cargar
  // ---------------------------------------------------------

  const cargarLista = useCallback(async () => {
    try {
      setConversaciones(await api('/conversaciones'))
      setErrorLista('')
    } catch (err) {
      setErrorLista(err.message)
    } finally {
      setCargandoLista(false)
    }
  }, [])

  const leer = useCallback(
    (conversacionId) => {
      marcarLeidos(conversacionId)
      setConversaciones((lista) => lista.map((c) => (c.id === conversacionId ? { ...c, no_leidos: 0 } : c)))
    },
    [marcarLeidos]
  )

  const cargarChat = useCallback(
    async (conversacionId, { silencioso = false } = {}) => {
      if (!silencioso) {
        setCargandoChat(true)
        setChat(null)
      }
      setErrorChat('')
      try {
        const datos = await api(`/conversaciones/${conversacionId}`)
        if (refActiva.current !== conversacionId) return
        refAlFinal.current = true
        setChat(datos)
        if (datos.conversacion.no_leidos > 0 && document.visibilityState === 'visible') leer(conversacionId)
      } catch (err) {
        if (refActiva.current !== conversacionId) return
        setErrorChat(err.status === 403 || err.status === 404 ? 'No encontramos esta conversación.' : err.message)
      } finally {
        if (refActiva.current === conversacionId) setCargandoChat(false)
      }
    },
    [leer]
  )

  useEffect(() => {
    if (sesion) cargarLista()
    else setCargandoLista(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTexto('')
    setEscribiendo(false)
    if (activaId && sesion) cargarChat(activaId)
    else setChat(null)
  }, [activaId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al reconectarse, recuperar lo que llegó mientras tanto
  const refConectadoAntes = useRef(conectado)
  useEffect(() => {
    if (conectado && !refConectadoAntes.current && sesion) {
      cargarLista()
      if (refActiva.current) cargarChat(refActiva.current, { silencioso: true })
    }
    refConectadoAntes.current = conectado
  }, [conectado]) // eslint-disable-line react-hooks/exhaustive-deps

  // Al volver a la pestaña, marcar como leído lo que llegó
  useEffect(() => {
    const alCambiar = () => {
      const id = refActiva.current
      if (document.visibilityState !== 'visible' || !id) return
      if (refConversaciones.current.find((c) => c.id === id)?.no_leidos) leer(id)
    }
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [leer])

  // ---------------------------------------------------------
  // Eventos en tiempo real
  // ---------------------------------------------------------

  useEventoChat('mensaje:nuevo', ({ conversacion_id: conversacionId, mensaje: nuevo }) => {
    const esActiva = conversacionId === refActiva.current
    const visible = document.visibilityState === 'visible'
    const sumaNoLeido = esParaMi(nuevo, miId) && !(esActiva && visible)

    if (!refConversaciones.current.some((c) => c.id === conversacionId)) {
      cargarLista() // conversación nueva
    }
    setConversaciones((lista) => {
      const actual = lista.find((c) => c.id === conversacionId)
      if (!actual) return lista
      const actualizada = {
        ...actual,
        ultimo_mensaje: nuevo,
        fecha_ultimo_mensaje: nuevo.fecha,
        no_leidos: actual.no_leidos + (sumaNoLeido ? 1 : 0)
      }
      return [actualizada, ...lista.filter((c) => c.id !== conversacionId)]
    })

    if (esActiva) {
      setChat((c) => (c ? { ...c, mensajes: agregarSinRepetir(c.mensajes, nuevo) } : c))
      if (nuevo.remitente_id !== miId) setEscribiendo(false)
      if (esParaMi(nuevo, miId) && visible) marcarLeidos(conversacionId)
    }
  })

  useEventoChat('mensajes:leidos', ({ conversacion_id: conversacionId }) => {
    if (conversacionId !== refActiva.current) return
    const ahora = new Date().toISOString()
    setChat((c) =>
      c ? { ...c, mensajes: c.mensajes.map((m) => (m.remitente_id === miId && !m.leido_en ? { ...m, leido_en: ahora } : m)) } : c
    )
  })

  useEventoChat('escribiendo', ({ conversacion_id: conversacionId }) => {
    if (conversacionId !== refActiva.current) return
    setEscribiendo(true)
    clearTimeout(refTemporizador.current)
    refTemporizador.current = setTimeout(() => setEscribiendo(false), 3500)
  })

  useEffect(() => () => clearTimeout(refTemporizador.current), [])

  useEventoChat('regalo:estado', ({ regalo_id: regaloId }) => {
    // El estado cambia también "abierta" y el reservado: se recarga
    if (conversaciones.some((c) => c.regalo.id === regaloId)) cargarLista()
    if (chat?.conversacion.regalo.id === regaloId && refActiva.current) cargarChat(refActiva.current, { silencioso: true })
  })

  // ---------------------------------------------------------
  // Desplazamiento
  // ---------------------------------------------------------

  const alDesplazar = () => {
    const el = refLista.current
    if (!el) return
    refAlFinal.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useLayoutEffect(() => {
    const el = refLista.current
    if (!el || !chat) return
    if (refAltoAntes.current != null) {
      // Se cargaron mensajes anteriores: conservar lo que se estaba viendo
      el.scrollTop = el.scrollHeight - refAltoAntes.current
      refAltoAntes.current = null
    } else if (refAlFinal.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [chat, escribiendo])

  const cargarAnteriores = async () => {
    if (!chat?.mensajes.length) return
    setCargandoAnteriores(true)
    try {
      const datos = await api(`/conversaciones/${activaId}?antes_de=${chat.mensajes[0].id}`)
      refAltoAntes.current = refLista.current?.scrollHeight ?? null
      setChat((c) => ({ ...c, mensajes: [...datos.mensajes, ...c.mensajes], hay_mas: datos.hay_mas }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoAnteriores(false)
    }
  }

  // ---------------------------------------------------------
  // Enviar
  // ---------------------------------------------------------

  const ajustarAlto = () => {
    const el = refTexto.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const alEscribir = (e) => {
    setTexto(e.target.value)
    ajustarAlto()
    const ahora = Date.now()
    if (ahora - refUltimoAviso.current > 2500 && activaId) {
      refUltimoAviso.current = ahora
      avisarEscribiendo(activaId)
    }
  }

  const enviar = async (e) => {
    e?.preventDefault()
    const limpio = texto.trim()
    if (!limpio || enviando || !activaId) return

    setEnviando(true)
    try {
      const guardado = await enviarMensaje(activaId, limpio)
      refAlFinal.current = true
      setChat((c) => (c ? { ...c, mensajes: agregarSinRepetir(c.mensajes, guardado) } : c))
      setConversaciones((lista) => {
        const actual = lista.find((c) => c.id === activaId)
        if (!actual) return lista
        return [{ ...actual, ultimo_mensaje: guardado, fecha_ultimo_mensaje: guardado.fecha }, ...lista.filter((c) => c.id !== activaId)]
      })
      setTexto('')
      requestAnimationFrame(() => {
        ajustarAlto()
        refTexto.current?.focus()
      })
    } catch (err) {
      setError(err.message)
      // Si el chat se cerró mientras tanto, mostrarlo
      if (/cerrada/i.test(err.message)) cargarChat(activaId, { silencioso: true })
    } finally {
      setEnviando(false)
    }
  }

  const alPresionarTecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) enviar(e)
  }

  const reportar = async (motivo) => {
    setEnviandoReporte(true)
    try {
      await api(`/regalos/${chat.conversacion.regalo.id}/reportes`, {
        metodo: 'POST',
        cuerpo: { motivo, mensaje_id: reportando.id }
      })
      setReportando(null)
      setMensaje('Gracias. Un administrador revisará el mensaje.')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviandoReporte(false)
    }
  }

  // ---------------------------------------------------------
  // Datos calculados
  // ---------------------------------------------------------

  const filtradas = useMemo(
    () =>
      conversaciones.filter((c) => (filtro === 'todos' ? true : filtro === 'regalo' ? c.soy_dueno : !c.soy_dueno)),
    [conversaciones, filtro]
  )

  const opcionesFiltro = FILTROS.map((f) => ({
    ...f,
    total:
      f.id === 'todos'
        ? undefined
        : conversaciones.filter((c) => (f.id === 'regalo' ? c.soy_dueno : !c.soy_dueno)).reduce((s, c) => s + (c.no_leidos ? 1 : 0), 0) || undefined
  }))

  // Mensajes con separadores por día
  const bloques = useMemo(() => {
    const grupos = []
    for (const m of chat?.mensajes ?? []) {
      const dia = etiquetaDia(m.fecha)
      if (!grupos.length || grupos[grupos.length - 1].dia !== dia) grupos.push({ dia, mensajes: [] })
      grupos[grupos.length - 1].mensajes.push(m)
    }
    return grupos
  }, [chat?.mensajes])

  // ---------------------------------------------------------
  // Sin sesión
  // ---------------------------------------------------------

  if (!sesion) {
    return (
      <div className={`${claseFondo} flex items-center justify-center p-4`}>
        <EstadoVacio icono="🔒" titulo="Inicia sesión para ver tus mensajes" descripcion="Aquí conversas con las personas que regalan o piden algo.">
          <Link to="/login" className={claseBotonPrincipal}>Iniciar sesión</Link>
        </EstadoVacio>
      </div>
    )
  }

  const conv = chat?.conversacion
  const motivoCierre = conv && !conv.abierta ? MOTIVO_CIERRE[conv.regalo.oculto ? 'oculto' : conv.regalo.estado] : null

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className={`${claseFondo} lg:py-6`}>
      <div className="max-w-6xl mx-auto lg:px-8 h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-7rem)] grid md:grid-cols-[21rem_1fr] md:gap-4">
        {/* BANDEJA */}
        <aside className={`${activaId ? 'hidden md:flex' : 'flex'} flex-col min-h-0 bg-white dark:bg-[#1a2320] md:rounded-3xl md:border border-gray-100 dark:border-gray-800/60 md:shadow-xs`} aria-label="Conversaciones">
          <div className="p-4 pb-3 border-b border-gray-100 dark:border-gray-800/60 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">Regalos</p>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Mensajes</h1>
              </div>
              <Link to="/regalos" className={`text-xs font-bold text-[#176b2b] dark:text-[#2fa350] hover:underline rounded ${anilloFoco}`}>
                Ver regalos →
              </Link>
            </div>
            {conversaciones.length > 0 && <FiltroChips opciones={opcionesFiltro} valor={filtro} onCambiar={setFiltro} etiqueta="Filtrar conversaciones" />}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            {cargandoLista ? (
              <div className="space-y-2 p-1" aria-busy="true">
                {[0, 1, 2].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                ))}
              </div>
            ) : errorLista ? (
              <p className="p-4 text-sm text-red-700 dark:text-red-400">{errorLista}</p>
            ) : conversaciones.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-4xl" aria-hidden="true">💬</span>
                <p className="mt-3 text-sm font-extrabold text-gray-900 dark:text-white">Aún no tienes conversaciones</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-[#a8b3ae]">Pulsa "Me interesa" en un regalo o publica uno para empezar.</p>
                <Link to="/regalos" className={`${claseBotonPrincipal} mt-4`}>Explorar regalos</Link>
              </div>
            ) : filtradas.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-[#a8b3ae]">No hay conversaciones en este filtro.</p>
            ) : (
              <ul className="space-y-1">
                {filtradas.map((c) => (
                  <ElementoBandeja key={c.id} conversacion={c} activa={c.id === activaId} miId={miId} />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* CONVERSACIÓN */}
        <section className={`${activaId ? 'flex' : 'hidden md:flex'} flex-col min-h-0 bg-[#f7fbf8] dark:bg-[#121816] md:rounded-3xl md:border border-gray-100 dark:border-gray-800/60 md:shadow-xs overflow-hidden`} aria-label="Conversación">
          {!activaId ? (
            <div className="m-auto p-8 text-center max-w-sm">
              <span className="mx-auto w-16 h-16 rounded-2xl bg-white dark:bg-[#1a2320] border border-[#218739]/15 dark:border-gray-800 flex items-center justify-center text-3xl" aria-hidden="true">💬</span>
              <p className="mt-4 text-lg font-black text-gray-900 dark:text-white">Elige una conversación</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-[#a8b3ae]">Aquí acuerdan cuándo y dónde se entrega cada regalo.</p>
            </div>
          ) : (
            <>
              {/* ENCABEZADO */}
              <header className="flex items-center gap-3 px-3 sm:px-4 py-3 bg-white dark:bg-[#1a2320] border-b border-gray-100 dark:border-gray-800/60">
                <button
                  type="button"
                  onClick={() => setParametros({}, { replace: false })}
                  className={`md:hidden w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${anilloFoco}`}
                  aria-label="Volver a las conversaciones"
                >
                  ←
                </button>
                {conv ? (
                  <>
                    <Link to={`/regalos/${conv.regalo.id}`} className={`shrink-0 rounded-xl ${anilloFoco}`} aria-label={`Ver el regalo ${conv.regalo.titulo}`}>
                      <FotoRegalo ruta={conv.regalo.foto} alt="" className="w-11 h-11 rounded-xl text-lg" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 dark:text-white truncate">{conv.otro.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] truncate">
                        {escribiendo ? (
                          <span className="font-bold text-[#176b2b] dark:text-[#2fa350]">escribiendo…</span>
                        ) : (
                          <>
                            {conv.soy_dueno ? 'Le interesa tu regalo: ' : 'Regala: '}
                            <Link to={`/regalos/${conv.regalo.id}`} className="font-semibold hover:underline">{conv.regalo.titulo}</Link>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="hidden sm:block shrink-0">
                      <InsigniaRegalo estado={conv.regalo.estado} oculto={conv.regalo.oculto} />
                    </div>
                    {conv.soy_dueno && conv.abierta && (
                      <Link
                        to={`/regalos/${conv.regalo.id}`}
                        className={`shrink-0 inline-flex items-center min-h-9 px-3 rounded-xl text-xs font-bold bg-[#176b2b] dark:bg-[#218739] text-white hover:bg-[#218739] ${anilloFoco}`}
                      >
                        {conv.regalo.estado === 'reservado' ? 'Gestionar' : 'Reservar'}
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="flex-1 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                )}
              </header>

              {!conectado && (
                <p className="px-4 py-1.5 text-center text-[11px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-b border-amber-100 dark:border-amber-900/40" role="status">
                  Reconectando… Los mensajes se enviarán igual.
                </p>
              )}

              {/* MENSAJES */}
              <div ref={refLista} onScroll={alDesplazar} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-4" aria-live="polite" aria-relevant="additions">
                {cargandoChat ? (
                  <div className="space-y-3" aria-busy="true">
                    {['w-1/2', 'w-1/3 ml-auto', 'w-2/5'].map((w) => (
                      <div key={w} className={`h-12 rounded-2xl bg-gray-200/70 dark:bg-gray-800/60 animate-pulse ${w}`} />
                    ))}
                  </div>
                ) : errorChat ? (
                  <div className="m-auto text-center p-6">
                    <p className="text-sm font-bold text-gray-700 dark:text-[#dce4e0]">{errorChat}</p>
                    <Link to="/mensajes" className="mt-3 inline-block text-sm font-bold text-[#176b2b] dark:text-[#2fa350] hover:underline">Volver a la bandeja</Link>
                  </div>
                ) : chat ? (
                  <>
                    {chat.hay_mas ? (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={cargarAnteriores}
                          disabled={cargandoAnteriores}
                          className={`text-xs font-bold text-[#176b2b] dark:text-[#2fa350] px-3 py-1.5 rounded-full bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/60 cursor-pointer disabled:opacity-60 ${anilloFoco}`}
                        >
                          {cargandoAnteriores ? 'Cargando…' : 'Ver mensajes anteriores'}
                        </button>
                      </div>
                    ) : (
                      <ConsejosSeguridad />
                    )}

                    {bloques.map((bloque) => (
                      <Fragment key={bloque.dia + bloque.mensajes[0].id}>
                        <p className="text-center text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 first-letter:uppercase">
                          {bloque.dia}
                        </p>
                        <ul className="space-y-1.5">
                          {bloque.mensajes.map((m) => (
                            <Burbuja key={m.id} mensaje={m} mio={m.tipo === 'usuario' && m.remitente_id === miId} onReportar={setReportando} />
                          ))}
                        </ul>
                      </Fragment>
                    ))}

                    {escribiendo && (
                      <div className="flex" aria-hidden="true">
                        <span className="inline-flex gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/60">
                          {[0, 150, 300].map((retraso) => (
                            <span key={retraso} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${retraso}ms` }} />
                          ))}
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* ESCRIBIR */}
              {conv && (
                conv.abierta ? (
                  <form onSubmit={enviar} className="px-3 sm:px-4 py-3 bg-white dark:bg-[#1a2320] border-t border-gray-100 dark:border-gray-800/60">
                    <div className="flex items-end gap-2">
                      <label htmlFor="texto-mensaje" className="sr-only">Escribe un mensaje</label>
                      <textarea
                        id="texto-mensaje"
                        ref={refTexto}
                        value={texto}
                        onChange={alEscribir}
                        onKeyDown={alPresionarTecla}
                        rows={1}
                        maxLength={LIMITES_REGALO.mensaje}
                        placeholder="Escribe un mensaje…"
                        className="flex-1 resize-none max-h-36 px-4 py-2.5 text-sm rounded-2xl bg-gray-50 dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] focus:ring-2 focus:ring-[#218739]/20"
                      />
                      <button
                        type="submit"
                        disabled={!texto.trim() || enviando}
                        className={`w-11 h-11 shrink-0 rounded-full bg-[#176b2b] dark:bg-[#218739] hover:bg-[#218739] text-white flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${anilloFoco}`}
                        aria-label="Enviar mensaje"
                      >
                        {enviando ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
                        )}
                      </button>
                    </div>
                    {texto.length > LIMITES_REGALO.mensaje - 200 && (
                      <p className="mt-1 text-right text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae] tabular-nums">{texto.length}/{LIMITES_REGALO.mensaje}</p>
                    )}
                  </form>
                ) : (
                  <p className="px-4 py-4 text-center text-sm text-gray-600 dark:text-[#a8b3ae] bg-white dark:bg-[#1a2320] border-t border-gray-100 dark:border-gray-800/60">
                    🔒 Esta conversación está cerrada porque {motivoCierre ?? 'el regalo ya no está disponible'}.
                  </p>
                )
              )}
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {reportando && conv && (
          <ModalReporte
            titulo="Reportar mensaje"
            etiqueta={`Mensaje de ${conv.otro.nombre}`}
            nombre={`“${reportando.texto.length > 140 ? `${reportando.texto.slice(0, 140)}…` : reportando.texto}”`}
            detalle={`En el chat de "${conv.regalo.titulo}". El administrador solo verá este mensaje y los cercanos.`}
            procesando={enviandoReporte}
            onCancelar={() => setReportando(null)}
            onConfirmar={reportar}
          />
        )}
      </AnimatePresence>

      <Avisos mensaje={mensaje} error={error} onCerrarMensaje={() => setMensaje('')} onCerrarError={() => setError('')} />
    </div>
  )
}

export default Mensajes
