// =========================================================
// SERVICIO DE REGALOS (MARKETPLACE GRATUITO)
// =========================================================
// Publicaciones, estados (disponible → reservado → entregado, más
// liberar, cancelar, vencer y renovar), conversaciones entre quien
// regala y cada interesado, mensajes y reportes.
// Especificación: docs/requisitos/Especificacion_Regalos.md

import { prisma } from '../config/prisma.js'
import { borrarFotos } from '../utils/archivos.js'
import { emitirAUsuario, emitirAUsuarios } from '../utils/emisor.js'
import { HttpError } from '../utils/HttpError.js'
import * as serializar from '../utils/serializadoresRegalos.js'

export const DIAS_VIGENCIA = 30
const ESTADOS_ABIERTOS = ['disponible', 'reservado']
const MENSAJES_POR_MINUTO = 20

// Caja que contiene a Ciudad Bolívar (sale del GeoJSON del frontend).
// El frontend valida con el polígono exacto (Turf); aquí es un control
// básico para no aceptar coordenadas de otra ciudad.
const CAJA_CIUDAD_BOLIVAR = { latMin: 4.383, latMax: 4.6, lngMin: -74.214, lngMax: -74.12 }

const CON_DATOS = {
  usuario: true,
  reservado_para: true,
  _count: { select: { conversaciones: true } }
}

function enDias(dias) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
}

function limpiar(texto) {
  const valor = typeof texto === 'string' ? texto.trim() : texto
  return valor ? valor : null
}

// Las publicaciones disponibles pasan a "vencido" a los 30 días
export async function vencerRegalos() {
  const { count } = await prisma.regalo.updateMany({
    where: { estado: 'disponible', fecha_vencimiento: { lt: new Date() } },
    data: { estado: 'vencido' }
  })
  return count
}

async function buscarRegalo(id) {
  const regalo = await prisma.regalo.findUnique({ where: { id }, include: CON_DATOS })
  if (!regalo) throw new HttpError(404, 'Regalo no encontrado')
  return regalo
}

async function buscarRegaloPropio(id, usuarioId) {
  const regalo = await buscarRegalo(id)
  if (regalo.usuario_id !== usuarioId) {
    throw new HttpError(403, 'Solo quien publicó el regalo puede hacer esto')
  }
  return regalo
}

// ---------------------------------------------------------
// Publicaciones
// ---------------------------------------------------------

export async function listarDisponibles({ categoria, q }, usuarioId) {
  await vencerRegalos()

  const texto = limpiar(q)
  const regalos = await prisma.regalo.findMany({
    where: {
      estado: 'disponible',
      oculto: false,
      ...(categoria ? { categoria } : {}),
      ...(texto
        ? {
            OR: [
              { titulo: { contains: texto, mode: 'insensitive' } },
              { descripcion: { contains: texto, mode: 'insensitive' } },
              { barrio: { contains: texto, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    include: CON_DATOS,
    orderBy: { fecha_creacion: 'desc' }
  })

  return regalos.map((r) => serializar.regalo(r, { usuarioId }))
}

export async function obtener(id, usuario) {
  await vencerRegalos()
  const regalo = await buscarRegalo(id)

  const usuarioId = usuario?.id ?? null
  const esMio = regalo.usuario_id === usuarioId
  const esAdmin = Boolean(usuario?.es_admin)

  if (regalo.oculto && !esMio && !esAdmin) {
    throw new HttpError(404, 'Regalo no encontrado')
  }

  const datos = serializar.regalo(regalo, { usuarioId, esAdmin })

  if (esMio) {
    // Interesados con su conversación, el último mensaje y los no leídos
    const conversaciones = await prisma.conversacion.findMany({
      where: { regalo_id: id },
      include: { interesado: true, mensajes: { take: 1, orderBy: { fecha: 'desc' } } },
      orderBy: { fecha_ultimo_mensaje: 'desc' }
    })
    const noLeidos = await contarNoLeidosPorConversacion(usuarioId, conversaciones.map((c) => c.id))

    datos.interesados = conversaciones.map((c) => ({
      conversacion_id: c.id,
      usuario: { id: c.interesado.id, nombre: c.interesado.nombre },
      ultimo_mensaje: c.mensajes[0] ? serializar.mensaje(c.mensajes[0]) : null,
      no_leidos: noLeidos.get(c.id) ?? 0,
      fecha_ultimo_mensaje: c.fecha_ultimo_mensaje.toISOString()
    }))
  } else if (usuarioId) {
    const propia = await prisma.conversacion.findUnique({
      where: { regalo_id_interesado_id: { regalo_id: id, interesado_id: usuarioId } },
      select: { id: true }
    })
    datos.mi_conversacion_id = propia?.id ?? null
  }

  return datos
}

export async function listarMios(usuarioId) {
  await vencerRegalos()

  const regalos = await prisma.regalo.findMany({
    where: { usuario_id: usuarioId },
    include: CON_DATOS,
    orderBy: { fecha_creacion: 'desc' }
  })
  return regalos.map((r) => serializar.regalo(r, { usuarioId }))
}

export async function crear(usuarioId, datos, rutasFotos) {
  if (!rutasFotos.length) {
    throw new HttpError(400, 'Agrega al menos una foto del regalo')
  }
  if (!(datos.cantidad > 0) || datos.cantidad > 100000) {
    throw new HttpError(400, 'La cantidad debe ser mayor que 0')
  }

  const { latitud, longitud } = datos
  const c = CAJA_CIUDAD_BOLIVAR
  if (!(latitud >= c.latMin && latitud <= c.latMax && longitud >= c.lngMin && longitud <= c.lngMax)) {
    throw new HttpError(400, 'La zona del regalo debe estar dentro de Ciudad Bolívar')
  }

  const regalo = await prisma.regalo.create({
    data: {
      usuario_id: usuarioId,
      titulo: datos.titulo.trim(),
      descripcion: limpiar(datos.descripcion),
      categoria: datos.categoria,
      cantidad: datos.cantidad,
      unidad: datos.unidad,
      latitud,
      longitud,
      barrio: limpiar(datos.barrio),
      fotos: rutasFotos,
      fecha_vencimiento: enDias(DIAS_VIGENCIA)
    },
    include: CON_DATOS
  })

  return serializar.regalo(regalo, { usuarioId })
}

export async function editar(id, usuarioId, datos) {
  const regalo = await buscarRegaloPropio(id, usuarioId)

  if (!['disponible', 'reservado', 'vencido'].includes(regalo.estado)) {
    throw new HttpError(409, 'Ya no puedes editar este regalo')
  }
  if (datos.cantidad !== undefined && !(datos.cantidad > 0)) {
    throw new HttpError(400, 'La cantidad debe ser mayor que 0')
  }

  const actualizado = await prisma.regalo.update({
    where: { id },
    data: {
      ...(datos.titulo !== undefined ? { titulo: datos.titulo.trim() } : {}),
      ...(datos.descripcion !== undefined ? { descripcion: limpiar(datos.descripcion) } : {}),
      ...(datos.cantidad !== undefined ? { cantidad: datos.cantidad } : {}),
      ...(datos.unidad !== undefined ? { unidad: datos.unidad } : {}),
      ...(datos.barrio !== undefined ? { barrio: limpiar(datos.barrio) } : {})
    },
    include: CON_DATOS
  })

  return serializar.regalo(actualizado, { usuarioId })
}

// ---------------------------------------------------------
// Estados
// ---------------------------------------------------------

// Escribe un mensaje del sistema en cada conversación del regalo
// (el texto puede depender del interesado) y avisa en tiempo real.
async function avisarEnConversaciones(regalo, textoPara) {
  const conversaciones = await prisma.conversacion.findMany({ where: { regalo_id: regalo.id } })

  for (const c of conversaciones) {
    const texto = textoPara(c.interesado_id)
    if (!texto) continue

    const creado = await prisma.mensaje.create({
      data: { conversacion_id: c.id, remitente_id: null, texto, tipo: 'sistema' }
    })
    await prisma.conversacion.update({ where: { id: c.id }, data: { fecha_ultimo_mensaje: creado.fecha } })

    emitirAUsuarios([regalo.usuario_id, c.interesado_id], 'mensaje:nuevo', {
      conversacion_id: c.id,
      mensaje: serializar.mensaje(creado)
    })
  }

  const participantes = [regalo.usuario_id, ...conversaciones.map((c) => c.interesado_id)]
  emitirAUsuarios(participantes, 'regalo:estado', { regalo_id: regalo.id, estado: regalo.estado })
  for (const id of new Set(conversaciones.map((c) => c.interesado_id))) await avisarNoLeidos(id)
}

export async function reservar(id, usuarioId, interesadoId) {
  const regalo = await buscarRegaloPropio(id, usuarioId)

  if (regalo.estado !== 'disponible') {
    throw new HttpError(409, 'Solo puedes reservar un regalo disponible')
  }

  const conversacion = await prisma.conversacion.findUnique({
    where: { regalo_id_interesado_id: { regalo_id: id, interesado_id: interesadoId } },
    include: { interesado: true }
  })
  if (!conversacion) {
    throw new HttpError(400, 'Esa persona no ha mostrado interés en este regalo')
  }

  const actualizado = await prisma.regalo.update({
    where: { id },
    data: { estado: 'reservado', reservado_para_id: interesadoId },
    include: CON_DATOS
  })

  await avisarEnConversaciones(actualizado, (interesado) =>
    interesado === interesadoId
      ? `🎁 ${regalo.usuario.nombre} reservó este regalo para ti. Acuerden aquí cuándo y dónde recogerlo.`
      : 'Este regalo se reservó para otra persona. Si vuelve a estar disponible, te avisaremos aquí.'
  )

  return serializar.regalo(actualizado, { usuarioId })
}

export async function liberar(id, usuarioId) {
  const regalo = await buscarRegaloPropio(id, usuarioId)

  if (regalo.estado !== 'reservado') {
    throw new HttpError(409, 'Este regalo no está reservado')
  }

  const actualizado = await prisma.regalo.update({
    where: { id },
    data: { estado: 'disponible', reservado_para_id: null, fecha_vencimiento: enDias(DIAS_VIGENCIA) },
    include: CON_DATOS
  })

  await avisarEnConversaciones(actualizado, () => '🔄 Este regalo volvió a estar disponible.')

  return serializar.regalo(actualizado, { usuarioId })
}

export async function entregar(id, usuarioId) {
  const regalo = await buscarRegaloPropio(id, usuarioId)

  if (regalo.estado !== 'reservado') {
    throw new HttpError(409, 'Primero reserva el regalo para la persona que lo recogió')
  }

  const actualizado = await prisma.regalo.update({
    where: { id },
    data: { estado: 'entregado', fecha_entrega: new Date() },
    include: CON_DATOS
  })

  await avisarEnConversaciones(actualizado, (interesado) =>
    interesado === regalo.reservado_para_id
      ? '✅ Regalo entregado. ¡Gracias por darle una segunda vida!'
      : 'Este regalo ya fue entregado a otra persona.'
  )

  return serializar.regalo(actualizado, { usuarioId })
}

export async function cancelar(id, usuarioId) {
  const regalo = await buscarRegaloPropio(id, usuarioId)

  if (!['disponible', 'reservado', 'vencido'].includes(regalo.estado)) {
    throw new HttpError(409, 'Este regalo ya no se puede cancelar')
  }

  const actualizado = await prisma.regalo.update({
    where: { id },
    data: { estado: 'cancelado' },
    include: CON_DATOS
  })

  await avisarEnConversaciones(actualizado, () => 'Quien publicó este regalo ya no lo está regalando.')

  return serializar.regalo(actualizado, { usuarioId })
}

export async function renovar(id, usuarioId) {
  const regalo = await buscarRegaloPropio(id, usuarioId)

  if (!['disponible', 'vencido'].includes(regalo.estado)) {
    throw new HttpError(409, 'Solo puedes renovar un regalo disponible o vencido')
  }

  const actualizado = await prisma.regalo.update({
    where: { id },
    data: { estado: 'disponible', fecha_vencimiento: enDias(DIAS_VIGENCIA) },
    include: CON_DATOS
  })

  return serializar.regalo(actualizado, { usuarioId })
}

// ---------------------------------------------------------
// Conversaciones y mensajes
// ---------------------------------------------------------

// Conversación con su regalo; error si el usuario no participa
async function buscarConversacionDe(conversacionId, usuarioId) {
  const conversacion = await prisma.conversacion.findUnique({
    where: { id: conversacionId },
    include: { regalo: { include: { usuario: true } }, interesado: true }
  })

  if (!conversacion) throw new HttpError(404, 'Conversación no encontrada')

  const participa =
    conversacion.interesado_id === usuarioId || conversacion.regalo.usuario_id === usuarioId
  if (!participa) throw new HttpError(403, 'No participas en esta conversación')

  return conversacion
}

export function participantes(conversacion) {
  return [conversacion.regalo.usuario_id, conversacion.interesado_id]
}

export async function iniciarConversacion(regaloId, usuario) {
  const regalo = await buscarRegalo(regaloId)

  if (regalo.usuario_id === usuario.id) {
    throw new HttpError(400, 'No puedes pedir tu propio regalo')
  }

  const existente = await prisma.conversacion.findUnique({
    where: { regalo_id_interesado_id: { regalo_id: regaloId, interesado_id: usuario.id } }
  })
  if (existente) return { conversacion_id: existente.id, nueva: false }

  if (regalo.estado !== 'disponible' || regalo.oculto) {
    throw new HttpError(409, 'Este regalo ya no está disponible')
  }

  const conversacion = await prisma.conversacion.create({
    data: { regalo_id: regaloId, interesado_id: usuario.id }
  })

  // Primer mensaje automático para que quien regala vea el interés
  const creado = await prisma.mensaje.create({
    data: {
      conversacion_id: conversacion.id,
      remitente_id: null,
      tipo: 'sistema',
      texto: `👋 A ${usuario.nombre} le interesa este regalo.`
    }
  })

  emitirAUsuarios([regalo.usuario_id, usuario.id], 'mensaje:nuevo', {
    conversacion_id: conversacion.id,
    mensaje: serializar.mensaje(creado),
    conversacion_nueva: true
  })
  await avisarNoLeidos(regalo.usuario_id)

  return { conversacion_id: conversacion.id, nueva: true }
}

async function contarNoLeidosPorConversacion(usuarioId, conversacionesIds) {
  if (!conversacionesIds.length) return new Map()

  const filas = await prisma.mensaje.groupBy({
    by: ['conversacion_id'],
    where: {
      conversacion_id: { in: conversacionesIds },
      leido_en: null,
      OR: [{ remitente_id: null }, { remitente_id: { not: usuarioId } }]
    },
    _count: { _all: true }
  })
  return new Map(filas.map((f) => [f.conversacion_id, f._count._all]))
}

function filtroMisConversaciones(usuarioId) {
  return { OR: [{ interesado_id: usuarioId }, { regalo: { usuario_id: usuarioId } }] }
}

export async function contarNoLeidos(usuarioId) {
  return prisma.mensaje.count({
    where: {
      leido_en: null,
      OR: [{ remitente_id: null }, { remitente_id: { not: usuarioId } }],
      conversacion: filtroMisConversaciones(usuarioId)
    }
  })
}

export async function avisarNoLeidos(usuarioId) {
  emitirAUsuario(usuarioId, 'no_leidos', { total: await contarNoLeidos(usuarioId) })
}

export async function listarConversaciones(usuarioId) {
  const conversaciones = await prisma.conversacion.findMany({
    where: filtroMisConversaciones(usuarioId),
    include: {
      regalo: { include: { usuario: true } },
      interesado: true,
      mensajes: { take: 1, orderBy: { fecha: 'desc' } }
    },
    orderBy: { fecha_ultimo_mensaje: 'desc' }
  })

  const noLeidos = await contarNoLeidosPorConversacion(usuarioId, conversaciones.map((c) => c.id))
  return conversaciones.map((c) => serializar.conversacion(c, usuarioId, noLeidos.get(c.id) ?? 0))
}

export async function obtenerConversacion(conversacionId, usuarioId, { antesDe, limite = 50 } = {}) {
  const conversacion = await buscarConversacionDe(conversacionId, usuarioId)

  const tope = Math.min(Math.max(limite, 1), 100)
  const mensajes = await prisma.mensaje.findMany({
    where: {
      conversacion_id: conversacionId,
      ...(antesDe ? { id: { lt: antesDe } } : {})
    },
    orderBy: { id: 'desc' },
    take: tope
  })

  const noLeidos = (await contarNoLeidosPorConversacion(usuarioId, [conversacionId])).get(conversacionId) ?? 0

  return {
    conversacion: serializar.conversacion({ ...conversacion, mensajes: mensajes.slice(0, 1) }, usuarioId, noLeidos),
    mensajes: mensajes.reverse().map(serializar.mensaje),
    hay_mas: mensajes.length === tope
  }
}

// Límite de mensajes por minuto, en memoria (suficiente con un servidor)
const envios = new Map()

function controlarFrecuencia(usuarioId) {
  const ahora = Date.now()
  const recientes = (envios.get(usuarioId) ?? []).filter((t) => ahora - t < 60_000)
  if (recientes.length >= MENSAJES_POR_MINUTO) {
    throw new HttpError(429, 'Estás enviando muchos mensajes. Espera un momento.')
  }
  recientes.push(ahora)
  envios.set(usuarioId, recientes)
}

export async function enviarMensaje(conversacionId, usuarioId, textoRecibido) {
  const texto = typeof textoRecibido === 'string' ? textoRecibido.trim() : ''
  if (!texto) throw new HttpError(400, 'Escribe un mensaje')
  if (texto.length > 1000) throw new HttpError(400, 'El mensaje puede tener máximo 1000 caracteres')

  const conversacion = await buscarConversacionDe(conversacionId, usuarioId)

  if (!ESTADOS_ABIERTOS.includes(conversacion.regalo.estado) || conversacion.regalo.oculto) {
    throw new HttpError(409, 'Esta conversación está cerrada porque el regalo ya no está disponible')
  }

  controlarFrecuencia(usuarioId)

  const creado = await prisma.mensaje.create({
    data: { conversacion_id: conversacionId, remitente_id: usuarioId, texto, tipo: 'usuario' }
  })
  await prisma.conversacion.update({
    where: { id: conversacionId },
    data: { fecha_ultimo_mensaje: creado.fecha }
  })

  const datos = { conversacion_id: conversacionId, mensaje: serializar.mensaje(creado) }
  const [dueno, interesado] = participantes(conversacion)
  emitirAUsuarios([dueno, interesado], 'mensaje:nuevo', datos)
  await avisarNoLeidos(usuarioId === dueno ? interesado : dueno)

  return datos.mensaje
}

export async function marcarLeidos(conversacionId, usuarioId) {
  const conversacion = await buscarConversacionDe(conversacionId, usuarioId)

  const { count } = await prisma.mensaje.updateMany({
    where: {
      conversacion_id: conversacionId,
      leido_en: null,
      OR: [{ remitente_id: null }, { remitente_id: { not: usuarioId } }]
    },
    data: { leido_en: new Date() }
  })

  if (count > 0) {
    const [dueno, interesado] = participantes(conversacion)
    emitirAUsuario(usuarioId === dueno ? interesado : dueno, 'mensajes:leidos', {
      conversacion_id: conversacionId,
      lector_id: usuarioId
    })
    await avisarNoLeidos(usuarioId)
  }

  return { leidos: count }
}

// Para el aviso de "escribiendo": devuelve al otro participante
export async function otroParticipante(conversacionId, usuarioId) {
  const conversacion = await buscarConversacionDe(conversacionId, usuarioId)
  const [dueno, interesado] = participantes(conversacion)
  return usuarioId === dueno ? interesado : dueno
}

// ---------------------------------------------------------
// Reportes y moderación
// ---------------------------------------------------------

export async function reportar(regaloId, usuarioId, { motivo, mensaje_id }) {
  const regalo = await buscarRegalo(regaloId)

  if (mensaje_id) {
    const mensaje = await prisma.mensaje.findUnique({
      where: { id: mensaje_id },
      include: { conversacion: { include: { regalo: true } } }
    })
    const participa =
      mensaje &&
      mensaje.conversacion.regalo_id === regaloId &&
      (mensaje.conversacion.interesado_id === usuarioId || mensaje.conversacion.regalo.usuario_id === usuarioId)

    if (!participa) throw new HttpError(404, 'Mensaje no encontrado')
    if (mensaje.remitente_id === usuarioId) throw new HttpError(400, 'No puedes reportar tu propio mensaje')
  } else if (regalo.usuario_id === usuarioId) {
    throw new HttpError(400, 'No puedes reportar tu propio regalo')
  }

  const pendiente = await prisma.reporteRegalo.findFirst({
    where: { regalo_id: regaloId, usuario_id: usuarioId, mensaje_id: mensaje_id ?? null, estado: 'pendiente' }
  })
  if (pendiente) throw new HttpError(409, 'Ya enviaste este reporte; un administrador lo revisará')

  await prisma.reporteRegalo.create({
    data: { regalo_id: regaloId, usuario_id: usuarioId, mensaje_id: mensaje_id ?? null, motivo: motivo.trim() }
  })

  return { mensaje: 'Gracias. Un administrador revisará tu reporte.' }
}

// Para el admin: el mensaje reportado con dos mensajes antes y después,
// nunca la conversación completa
async function contextoMensaje(mensaje) {
  const [antes, despues] = await Promise.all([
    prisma.mensaje.findMany({
      where: { conversacion_id: mensaje.conversacion_id, id: { lt: mensaje.id } },
      orderBy: { id: 'desc' },
      take: 2,
      include: { remitente: true }
    }),
    prisma.mensaje.findMany({
      where: { conversacion_id: mensaje.conversacion_id, id: { gt: mensaje.id } },
      orderBy: { id: 'asc' },
      take: 2,
      include: { remitente: true }
    })
  ])

  const formatear = (m) => ({
    ...serializar.mensaje(m),
    remitente_nombre: m.remitente?.nombre ?? null,
    reportado: m.id === mensaje.id
  })

  return [...antes.reverse(), mensaje, ...despues].map(formatear)
}

export async function listarReportesAdmin() {
  const reportes = await prisma.reporteRegalo.findMany({
    include: {
      usuario: true,
      regalo: { include: CON_DATOS },
      mensaje: { include: { remitente: true } }
    },
    orderBy: { fecha_creacion: 'desc' }
  })

  return Promise.all(
    reportes.map(async (r) => ({
      id: r.id,
      estado: r.estado,
      motivo: r.motivo,
      observacion_admin: r.observacion_admin,
      fecha_creacion: r.fecha_creacion.toISOString(),
      reportante: { id: r.usuario.id, nombre: r.usuario.nombre, correo: r.usuario.correo },
      regalo: serializar.regalo(r.regalo, { esAdmin: true }),
      mensaje: r.mensaje
        ? {
            id: r.mensaje.id,
            texto: r.mensaje.texto,
            remitente_nombre: r.mensaje.remitente?.nombre ?? null,
            contexto: await contextoMensaje(r.mensaje)
          }
        : null
    }))
  )
}

export async function revisarReporteAdmin(reporteId, { estado, observacion_admin }) {
  const reporte = await prisma.reporteRegalo.findUnique({ where: { id: reporteId } })
  if (!reporte) throw new HttpError(404, 'Reporte no encontrado')
  if (reporte.estado !== 'pendiente') throw new HttpError(409, 'Este reporte ya fue gestionado')

  const actualizado = await prisma.reporteRegalo.update({
    where: { id: reporteId },
    data: { estado, observacion_admin: limpiar(observacion_admin) }
  })
  return { id: actualizado.id, estado: actualizado.estado, observacion_admin: actualizado.observacion_admin }
}

export async function ocultarAdmin(regaloId, { oculto, motivo }) {
  const regalo = await buscarRegalo(regaloId)

  const actualizado = await prisma.regalo.update({
    where: { id: regaloId },
    data: { oculto, motivo_ocultamiento: oculto ? limpiar(motivo) : null },
    include: CON_DATOS
  })

  if (oculto && !regalo.oculto) {
    await avisarEnConversaciones(actualizado, () => 'Un administrador ocultó esta publicación.')
  }

  return serializar.regalo(actualizado, { esAdmin: true })
}

export async function eliminarAdmin(regaloId) {
  const regalo = await buscarRegalo(regaloId)
  const conversaciones = await prisma.conversacion.findMany({ where: { regalo_id: regaloId } })

  // Conversaciones, mensajes y reportes se borran en cascada
  await prisma.regalo.delete({ where: { id: regaloId } })
  await borrarFotos(regalo.fotos)

  emitirAUsuarios(
    [regalo.usuario_id, ...conversaciones.map((c) => c.interesado_id)],
    'regalo:estado',
    { regalo_id: regaloId, estado: 'eliminado' }
  )
  for (const c of conversaciones) await avisarNoLeidos(c.interesado_id)
  await avisarNoLeidos(regalo.usuario_id)

  return { mensaje: 'Regalo eliminado' }
}

// Resumen para el dashboard de impacto
export async function resumenImpacto() {
  const [enKg, entregados, disponibles] = await Promise.all([
    prisma.regalo.aggregate({
      where: { estado: 'entregado', unidad: 'kg' },
      _sum: { cantidad: true }
    }),
    prisma.regalo.count({ where: { estado: 'entregado' } }),
    prisma.regalo.count({ where: { estado: 'disponible', oculto: false } })
  ])

  return {
    kg_reutilizados: Math.round((enKg._sum.cantidad ?? 0) * 100) / 100,
    regalos_entregados: entregados,
    regalos_disponibles: disponibles
  }
}
