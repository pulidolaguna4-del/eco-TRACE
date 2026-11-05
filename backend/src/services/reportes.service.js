// =========================================================
// SERVICIO DE REPORTES DE PUNTOS ECOLÓGICOS
// =========================================================

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'

const ESTADOS_REVISION = new Set(['revisado', 'descartado'])

export async function registrar(usuarioId, { punto_id, motivo }) {
  const motivoLimpio = motivo.trim()

  if (motivoLimpio.length < 5) {
    throw new HttpError(400, 'Explica el motivo del reporte con al menos 5 caracteres')
  }

  const punto = await prisma.punto.findUnique({ where: { id: punto_id } })
  if (!punto || punto.estado !== 'aprobado') {
    throw new HttpError(404, 'No se encontró un punto ecológico disponible para reportar')
  }

  // Evitar reportes pendientes duplicados del mismo usuario sobre el mismo punto
  const pendiente = await prisma.reporte.findFirst({
    where: { punto_id, usuario_id: usuarioId, estado: 'pendiente' }
  })
  if (pendiente) {
    throw new HttpError(409, 'Ya tienes un reporte pendiente para este punto')
  }

  return prisma.reporte.create({
    data: {
      punto_id,
      usuario_id: usuarioId,
      motivo: motivoLimpio,
      estado: 'pendiente'
    }
  })
}

export function listarTodos() {
  return prisma.reporte.findMany({
    include: { usuario: true, punto: true },
    orderBy: { fecha_creacion: 'desc' }
  })
}

export async function revisar(reporteId, { estado, observacion_admin }) {
  if (!ESTADOS_REVISION.has(estado)) {
    throw new HttpError(400, "El estado debe ser 'revisado' o 'descartado'")
  }

  const reporte = await prisma.reporte.findUnique({ where: { id: reporteId } })
  if (!reporte) {
    throw new HttpError(404, 'Reporte no encontrado')
  }
  if (reporte.estado !== 'pendiente') {
    throw new HttpError(409, 'Este reporte ya fue gestionado')
  }

  return prisma.reporte.update({
    where: { id: reporteId },
    data: {
      estado,
      observacion_admin: observacion_admin ? observacion_admin.trim() : null
    }
  })
}
