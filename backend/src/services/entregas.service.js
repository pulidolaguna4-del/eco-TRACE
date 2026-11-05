// =========================================================
// SERVICIO DE ENTREGAS / DONACIONES / RECICLAJE
// =========================================================

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'

export async function registrar(usuarioId, datos) {
  const punto = await prisma.punto.findUnique({ where: { id: datos.punto_id } })

  if (!punto) {
    throw new HttpError(404, 'Punto no encontrado')
  }
  if (punto.estado !== 'aprobado') {
    throw new HttpError(
      400,
      'No puedes registrar una entrega en un punto que no está aprobado'
    )
  }
  if (datos.cantidad <= 0) {
    throw new HttpError(400, 'La cantidad debe ser mayor que 0')
  }

  return prisma.entrega.create({
    data: {
      usuario_id: usuarioId,
      punto_id: datos.punto_id,
      tipo: datos.tipo,
      cantidad: datos.cantidad,
      unidad: datos.unidad,
      estado: 'registrada',
      observacion: datos.observacion ?? null
    }
  })
}

export function listarDeUsuario(usuarioId) {
  return prisma.entrega.findMany({
    where: { usuario_id: usuarioId },
    orderBy: { fecha: 'desc' }
  })
}

export function listarTodas() {
  return prisma.entrega.findMany({
    include: { usuario: true, punto: true },
    orderBy: { fecha: 'desc' }
  })
}
