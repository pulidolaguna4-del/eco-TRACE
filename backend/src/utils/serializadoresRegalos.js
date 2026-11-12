// =========================================================
// SERIALIZADORES DE REGALOS, CONVERSACIONES Y MENSAJES
// =========================================================

import { createHmac } from 'node:crypto'

import { config } from '../config/env.js'
import { fecha } from './serializers.js'

export const RADIO_ZONA_M = 300

// Zona aproximada: un centro desplazado entre 60 y 220 m de la ubicación
// real, siempre igual para el mismo regalo (si cambiara, promediando
// varias consultas se podría adivinar el punto exacto). El desplazamiento
// sale de un HMAC con la clave secreta del servidor, así que no se puede
// deshacer aunque el código sea público. Con un radio de 300 m, el punto
// real siempre queda dentro del círculo.
export function zonaAproximada({ id, latitud, longitud }) {
  const hash = createHmac('sha256', config.jwt.secret).update(`zona-regalo:${id}`).digest()
  const azar1 = hash.readUInt32BE(0) / 0xffffffff
  const azar2 = hash.readUInt32BE(4) / 0xffffffff

  const distancia = 60 + azar1 * 160
  const angulo = azar2 * 2 * Math.PI
  const dLat = (distancia * Math.cos(angulo)) / 111320
  const dLng = (distancia * Math.sin(angulo)) / (111320 * Math.cos((latitud * Math.PI) / 180))

  return {
    latitud: Number((latitud + dLat).toFixed(5)),
    longitud: Number((longitud + dLng).toFixed(5)),
    radio_m: RADIO_ZONA_M
  }
}

// Incluir con: include: { usuario: true, reservado_para: true, _count: { select: { conversaciones: true } } }
export function regalo(r, { usuarioId = null, esAdmin = false } = {}) {
  const esMio = usuarioId != null && r.usuario_id === usuarioId

  return {
    id: r.id,
    titulo: r.titulo,
    descripcion: r.descripcion,
    categoria: r.categoria,
    cantidad: r.cantidad,
    unidad: r.unidad,
    estado: r.estado,
    barrio: r.barrio,
    fotos: r.fotos ?? [],
    zona: zonaAproximada(r),
    usuario: { id: r.usuario_id, nombre: r.usuario?.nombre ?? 'Usuario' },
    total_interesados: r._count?.conversaciones ?? 0,
    fecha_creacion: fecha(r.fecha_creacion),
    fecha_vencimiento: fecha(r.fecha_vencimiento),
    fecha_entrega: fecha(r.fecha_entrega),
    es_mio: esMio,
    reservado_para_mi: usuarioId != null && r.reservado_para_id === usuarioId,
    // Solo para quien lo publicó (y el admin)
    ...(esMio || esAdmin
      ? {
          ubicacion_exacta: { latitud: r.latitud, longitud: r.longitud },
          reservado_para: r.reservado_para ? { id: r.reservado_para.id, nombre: r.reservado_para.nombre } : null,
          oculto: r.oculto,
          motivo_ocultamiento: r.motivo_ocultamiento
        }
      : {})
  }
}

export function mensaje(m) {
  return {
    id: m.id,
    conversacion_id: m.conversacion_id,
    remitente_id: m.remitente_id,
    texto: m.texto,
    tipo: m.tipo,
    fecha: fecha(m.fecha),
    leido_en: fecha(m.leido_en)
  }
}

// Una conversación vista por uno de sus participantes.
// Incluir con: include: { regalo: { include: { usuario: true } }, interesado: true, mensajes: { take: 1, orderBy: { fecha: 'desc' } } }
export function conversacion(c, usuarioId, noLeidos = 0) {
  const soyDueno = c.regalo.usuario_id === usuarioId
  const otro = soyDueno ? c.interesado : c.regalo.usuario
  const ultimo = c.mensajes?.[0]

  return {
    id: c.id,
    soy_dueno: soyDueno,
    otro: { id: otro?.id ?? null, nombre: otro?.nombre ?? 'Usuario' },
    regalo: {
      id: c.regalo.id,
      titulo: c.regalo.titulo,
      foto: c.regalo.fotos?.[0] ?? null,
      estado: c.regalo.estado,
      oculto: c.regalo.oculto,
      cantidad: c.regalo.cantidad,
      unidad: c.regalo.unidad,
      reservado_para_id: c.regalo.reservado_para_id
    },
    interesado_id: c.interesado_id,
    abierta: ['disponible', 'reservado'].includes(c.regalo.estado) && !c.regalo.oculto,
    ultimo_mensaje: ultimo ? mensaje(ultimo) : null,
    no_leidos: noLeidos,
    fecha_ultimo_mensaje: fecha(c.fecha_ultimo_mensaje)
  }
}
