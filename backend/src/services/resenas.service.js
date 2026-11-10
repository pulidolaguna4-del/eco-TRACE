// =========================================================
// SERVICIO DE RESEÑAS DE PUNTOS ECOLÓGICOS (HU-23)
// =========================================================

import { config } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'

const DIA_MS = 24 * 60 * 60 * 1000

const CON_AUTOR = { usuario: { select: { nombre: true } } }

async function obtenerPuntoAprobado(puntoId) {
  const punto = await prisma.punto.findUnique({ where: { id: puntoId } })
  if (!punto || punto.estado !== 'aprobado') {
    throw new HttpError(404, 'Punto no encontrado')
  }
  return punto
}

// ---------------------------------------------------------
// Recalcula el promedio y el total del punto, y lo marca para
// revisión prioritaria si superó el umbral de reseñas negativas
// recientes. La marca solo la quita un administrador.
// ---------------------------------------------------------
export async function recalcular(puntoId, tx = prisma) {
  const punto = await tx.punto.findUnique({
    where: { id: puntoId },
    select: { id: true, fecha_revision: true }
  })
  if (!punto) return null

  const { umbralNegativas, diasRecientes, puntuacionNegativa } = config.resenas

  // Solo cuentan las negativas posteriores a la última revisión del admin
  const haceDias = new Date(Date.now() - diasRecientes * DIA_MS)
  const desde =
    punto.fecha_revision && punto.fecha_revision > haceDias
      ? punto.fecha_revision
      : haceDias

  const [resumen, negativas] = await Promise.all([
    tx.resena.aggregate({
      where: { punto_id: puntoId },
      _avg: { puntuacion: true },
      _count: { _all: true }
    }),
    tx.resena.count({
      where: {
        punto_id: puntoId,
        puntuacion: { lte: puntuacionNegativa },
        fecha_actualizacion: { gt: desde }
      }
    })
  ])

  const superaUmbral = umbralNegativas > 0 && negativas >= umbralNegativas

  return tx.punto.update({
    where: { id: puntoId },
    data: {
      calificacion_promedio: Math.round((resumen._avg.puntuacion ?? 0) * 100) / 100,
      total_resenas: resumen._count._all,
      ...(superaUmbral
        ? {
            revision_prioritaria: true,
            motivo_revision: `${negativas} reseñas de 1 o 2 estrellas en los últimos ${diasRecientes} días`
          }
        : {})
    }
  })
}

// ---------------------------------------------------------
// Consulta
// ---------------------------------------------------------

export async function listar(puntoId, usuarioId = null) {
  const punto = await obtenerPuntoAprobado(puntoId)

  const resenas = await prisma.resena.findMany({
    where: { punto_id: puntoId },
    include: CON_AUTOR,
    orderBy: { fecha_actualizacion: 'desc' }
  })

  const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const resena of resenas) distribucion[resena.puntuacion] += 1

  return {
    punto,
    resenas,
    distribucion,
    miResena: usuarioId ? resenas.find((r) => r.usuario_id === usuarioId) ?? null : null
  }
}

// ---------------------------------------------------------
// Crear o editar la reseña propia (nunca se duplica)
// ---------------------------------------------------------

export async function guardar(usuarioId, puntoId, { puntuacion, comentario }) {
  const punto = await obtenerPuntoAprobado(puntoId)

  if (punto.usuario_id === usuarioId) {
    throw new HttpError(403, 'No puedes calificar un punto que tú propusiste')
  }

  const comentarioLimpio = comentario?.trim() || null
  const clave = { usuario_id_punto_id: { usuario_id: usuarioId, punto_id: puntoId } }

  const existente = await prisma.resena.findUnique({ where: clave })

  const [resena, puntoActualizado] = await prisma.$transaction(async (tx) => {
    const guardada = await tx.resena.upsert({
      where: clave,
      create: {
        usuario_id: usuarioId,
        punto_id: puntoId,
        puntuacion,
        comentario: comentarioLimpio
      },
      update: { puntuacion, comentario: comentarioLimpio },
      include: CON_AUTOR
    })

    return [guardada, await recalcular(puntoId, tx)]
  })

  return { resena, punto: puntoActualizado, creada: !existente }
}

export async function eliminar(usuarioId, puntoId) {
  const clave = { usuario_id_punto_id: { usuario_id: usuarioId, punto_id: puntoId } }

  const existente = await prisma.resena.findUnique({ where: clave })
  if (!existente) {
    throw new HttpError(404, 'No has calificado este punto')
  }

  return prisma.$transaction(async (tx) => {
    await tx.resena.delete({ where: clave })
    return recalcular(puntoId, tx)
  })
}
