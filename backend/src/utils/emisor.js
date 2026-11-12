// =========================================================
// EMISOR DE EVENTOS EN TIEMPO REAL
// =========================================================
// Guarda la instancia de Socket.IO para que los servicios puedan avisar
// a los usuarios sin importar el módulo del servidor de sockets (evita
// importaciones circulares). Cada usuario conectado está en la sala
// `usuario:<id>`, así recibe los eventos en todas sus pestañas.

let io = null

export function registrarIo(instancia) {
  io = instancia
}

export function emitirAUsuario(usuarioId, evento, datos) {
  if (!io || usuarioId == null) return
  io.to(`usuario:${usuarioId}`).emit(evento, datos)
}

export function emitirAUsuarios(usuariosIds, evento, datos) {
  for (const id of new Set(usuariosIds)) emitirAUsuario(id, evento, datos)
}
