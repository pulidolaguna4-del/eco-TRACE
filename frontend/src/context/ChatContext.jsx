// =========================================================
// CHAT EN TIEMPO REAL (REGALOS)
// =========================================================
// Una sola conexión de Socket.IO para toda la aplicación:
// - Se conecta con el JWT de la sesión y se desconecta al cerrar sesión.
//   El token vive en localStorage, por eso se vuelve a leer al cambiar
//   de página (login y logout navegan) y cuando otra pestaña lo cambia.
// - Lleva el total de mensajes no leídos (contador de la barra).
// - Las páginas escuchan eventos con `suscribir(evento, fn)`.
// - Enviar y marcar como leído usan el socket y, si no está conectado,
//   la API REST (el historial siempre se recupera por REST).
//
// Eventos del servidor: mensaje:nuevo, mensajes:leidos, escribiendo,
// regalo:estado, no_leidos

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'

import { API_URL } from '../../config'
import { api } from '../utils/regalos'

const ChatContext = createContext(null)

const ESPERA_CONFIRMACION_MS = 8000

export function ChatProvider({ children }) {
  const location = useLocation()

  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [conectado, setConectado] = useState(false)
  const [noLeidos, setNoLeidos] = useState(0)

  const refSocket = useRef(null)
  const refOyentes = useRef(new Map()) // evento -> Set de funciones

  // Volver a leer el token al navegar y cuando otra pestaña lo cambia
  useEffect(() => {
    setToken(localStorage.getItem('access_token'))
  }, [location.pathname])

  useEffect(() => {
    const alCambiar = (e) => {
      if (e.key === null || e.key === 'access_token') setToken(localStorage.getItem('access_token'))
    }
    window.addEventListener('storage', alCambiar)
    return () => window.removeEventListener('storage', alCambiar)
  }, [])

  const refrescarNoLeidos = useCallback(async () => {
    if (!localStorage.getItem('access_token')) return
    try {
      const { total } = await api('/conversaciones/no-leidos')
      setNoLeidos(total)
    } catch {
      // Sin conexión: se mantiene el último valor
    }
  }, [])

  // Conexión
  useEffect(() => {
    if (!token) {
      setNoLeidos(0)
      return
    }

    // Por si el socket tarda o no logra conectarse
    refrescarNoLeidos()

    const socket = io(API_URL, { auth: { token } })
    refSocket.current = socket

    socket.on('connect', () => setConectado(true))
    socket.on('disconnect', () => setConectado(false))
    socket.on('connect_error', (error) => {
      setConectado(false)
      // Token vencido o inválido: no tiene sentido reintentar
      if (error.message === 'No autorizado') socket.disconnect()
    })
    socket.on('no_leidos', ({ total }) => setNoLeidos(total))

    socket.onAny((evento, datos) => {
      refOyentes.current.get(evento)?.forEach((fn) => fn(datos))
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      refSocket.current = null
      setConectado(false)
    }
  }, [token, refrescarNoLeidos])

  const suscribir = useCallback((evento, fn) => {
    const oyentes = refOyentes.current
    if (!oyentes.has(evento)) oyentes.set(evento, new Set())
    oyentes.get(evento).add(fn)
    return () => oyentes.get(evento)?.delete(fn)
  }, [])

  // Devuelve el mensaje guardado o lanza un Error con el motivo
  const enviarMensaje = useCallback(async (conversacionId, texto) => {
    const socket = refSocket.current

    if (socket?.connected) {
      let respuesta
      try {
        respuesta = await socket
          .timeout(ESPERA_CONFIRMACION_MS)
          .emitWithAck('mensaje:enviar', { conversacion_id: conversacionId, texto })
      } catch {
        // Sin confirmación: no se reenvía por REST para no duplicarlo
        throw new Error('No recibimos confirmación del envío. Revisa tu conexión y vuelve a intentarlo.')
      }
      if (!respuesta?.ok) throw new Error(respuesta?.error || 'No se pudo enviar el mensaje.')
      return respuesta.mensaje
    }

    return api(`/conversaciones/${conversacionId}/mensajes`, { metodo: 'POST', cuerpo: { texto } })
  }, [])

  const marcarLeidos = useCallback(async (conversacionId) => {
    const socket = refSocket.current
    try {
      if (socket?.connected) {
        await socket.timeout(ESPERA_CONFIRMACION_MS).emitWithAck('mensajes:leidos', { conversacion_id: conversacionId })
      } else {
        await api(`/conversaciones/${conversacionId}/leidos`, { metodo: 'PUT' })
        refrescarNoLeidos()
      }
    } catch {
      // No es grave: se marcarán la próxima vez que se abra
    }
  }, [refrescarNoLeidos])

  const avisarEscribiendo = useCallback((conversacionId) => {
    const socket = refSocket.current
    if (socket?.connected) socket.emit('escribiendo', { conversacion_id: conversacionId })
  }, [])

  const valor = useMemo(
    () => ({ conectado, noLeidos, suscribir, enviarMensaje, marcarLeidos, avisarEscribiendo, refrescarNoLeidos }),
    [conectado, noLeidos, suscribir, enviarMensaje, marcarLeidos, avisarEscribiendo, refrescarNoLeidos]
  )

  return <ChatContext.Provider value={valor}>{children}</ChatContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const contexto = useContext(ChatContext)
  if (!contexto) throw new Error('useChat debe usarse dentro de un ChatProvider')
  return contexto
}

// Escucha un evento del chat mientras el componente esté montado.
// `fn` puede cambiar en cada render: siempre se llama la versión actual.
// eslint-disable-next-line react-refresh/only-export-components
export function useEventoChat(evento, fn) {
  const { suscribir } = useChat()
  const refFn = useRef(fn)

  useEffect(() => {
    refFn.current = fn
  })

  useEffect(() => suscribir(evento, (datos) => refFn.current(datos)), [evento, suscribir])
}
