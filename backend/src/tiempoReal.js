// =========================================================
// CHAT EN TIEMPO REAL (SOCKET.IO)
// =========================================================
// Corre en el mismo servidor HTTP que la API (puerto 8000).
//
// - Conexión: io(API_URL, { auth: { token } }). Se verifica el JWT;
//   sin un token válido se rechaza.
// - Cada usuario entra a la sala `usuario:<id>`: ahí recibe sus
//   mensajes, avisos y el total de no leídos, en todas sus pestañas.
// - Antes de cada acción se comprueba que participe en la conversación
//   (lo hace el servicio). Todo mensaje se guarda antes de emitirse.
//
// Eventos del cliente:  mensaje:enviar, mensajes:leidos, escribiendo
// Eventos del servidor: mensaje:nuevo, mensajes:leidos, escribiendo,
//                       regalo:estado, no_leidos

import { Server } from 'socket.io'

import { config } from './config/env.js'
import { prisma } from './config/prisma.js'
import * as regalosService from './services/regalos.service.js'
import { registrarIo, emitirAUsuario } from './utils/emisor.js'
import { HttpError } from './utils/HttpError.js'
import { verificarToken } from './utils/jwt.js'

function mensajeDeError(error) {
  if (error instanceof HttpError) return typeof error.detail === 'string' ? error.detail : 'Solicitud inválida'
  console.error('ERROR EN EL CHAT:', error)
  return 'Ocurrió un error en el chat'
}

// Ejecuta la acción y responde por el "ack" del cliente
function conRespuesta(accion) {
  return async (datos, responder) => {
    const ack = typeof responder === 'function' ? responder : () => {}
    try {
      ack({ ok: true, ...(await accion(datos ?? {})) })
    } catch (error) {
      ack({ ok: false, error: mensajeDeError(error) })
    }
  }
}

export function iniciarTiempoReal(servidorHttp) {
  const io = new Server(servidorHttp, {
    cors: { origin: config.corsOrigin, credentials: true },
    maxHttpBufferSize: 16 * 1024
  })

  // Autenticación con el mismo JWT de la API
  io.use(async (socket, next) => {
    try {
      const datos = verificarToken(socket.handshake.auth?.token ?? '')
      const usuario = await prisma.usuario.findUnique({ where: { id: Number.parseInt(datos.sub, 10) } })
      if (!usuario) return next(new Error('No autorizado'))
      socket.data.usuario = { id: usuario.id, nombre: usuario.nombre }
      next()
    } catch {
      next(new Error('No autorizado'))
    }
  })

  io.on('connection', (socket) => {
    const { id: usuarioId } = socket.data.usuario
    socket.join(`usuario:${usuarioId}`)

    // Los manejadores se registran antes de cualquier await: un evento que
    // el cliente envíe justo al conectarse no se debe perder.
    socket.on(
      'mensaje:enviar',
      conRespuesta(async ({ conversacion_id, texto }) => ({
        mensaje: await regalosService.enviarMensaje(Number(conversacion_id), usuarioId, texto)
      }))
    )

    socket.on(
      'mensajes:leidos',
      conRespuesta(async ({ conversacion_id }) => regalosService.marcarLeidos(Number(conversacion_id), usuarioId))
    )

    socket.on('escribiendo', async ({ conversacion_id } = {}) => {
      try {
        const otro = await regalosService.otroParticipante(Number(conversacion_id), usuarioId)
        emitirAUsuario(otro, 'escribiendo', { conversacion_id: Number(conversacion_id), usuario_id: usuarioId })
      } catch {
        // No participa o no existe: se ignora
      }
    })

    regalosService
      .contarNoLeidos(usuarioId)
      .then((total) => socket.emit('no_leidos', { total }))
      .catch((error) => console.error('ERROR EN EL CHAT:', error))
  })

  registrarIo(io)
  return io
}
