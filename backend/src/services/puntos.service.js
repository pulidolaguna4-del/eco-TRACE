// =========================================================
// SERVICIO DE PUNTOS ECOLÓGICOS
// =========================================================

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'
import { borrarFotos } from '../utils/archivos.js'
import { enviarNotificacionPunto } from './email.service.js'

const CON_CATEGORIAS = {
  categorias: { include: { categoria: true } }
}

function listarDonde(where) {
  return prisma.punto.findMany({
    where,
    include: CON_CATEGORIAS,
    orderBy: { id: 'asc' }
  })
}

export const listarAprobados = () => listarDonde({ estado: 'aprobado' })
export const listarPendientes = () => listarDonde({ estado: 'pendiente' })
export const listarTodos = () => listarDonde({})
export const listarDeUsuario = (usuarioId) => listarDonde({ usuario_id: usuarioId })

export async function registrar(usuarioId, datos) {
  if (!datos.categorias.length) {
    throw new HttpError(400, 'Debe seleccionar al menos una categoría')
  }

  const categorias = await prisma.categoria.findMany({
    where: { nombre: { in: datos.categorias } }
  })
  const porNombre = new Map(categorias.map((c) => [c.nombre, c]))

  for (const nombre of datos.categorias) {
    if (!porNombre.has(nombre)) {
      throw new HttpError(400, `La categoría '${nombre}' no existe`)
    }
  }

  // Sin duplicados, para no violar la clave primaria compuesta
  const categoriaIds = [...new Set(datos.categorias.map((n) => porNombre.get(n).id))]

  return prisma.punto.create({
    data: {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      direccion: datos.direccion,
      localidad: datos.localidad,
      latitud: datos.latitud,
      longitud: datos.longitud,
      foto_url: datos.foto_url ?? null,
      estado: 'pendiente',
      usuario_id: usuarioId,
      categorias: {
        create: categoriaIds.map((categoria_id) => ({ categoria_id }))
      }
    },
    include: CON_CATEGORIAS
  })
}

// ---------------------------------------------------------
// Administración
// ---------------------------------------------------------

async function cambiarEstado(puntoId, estado, motivoRechazo) {
  const punto = await prisma.punto.findUnique({
    where: { id: puntoId },
    include: { usuario: true }
  })

  if (!punto) {
    throw new HttpError(404, 'Punto no encontrado')
  }
  if (!punto.usuario) {
    throw new HttpError(404, 'Usuario propietario del punto no encontrado')
  }

  const actualizado = await prisma.punto.update({
    where: { id: puntoId },
    data: {
      estado,
      // Solo se sobrescribe el motivo si se envía uno
      ...(motivoRechazo ? { motivo_rechazo: motivoRechazo } : {})
    },
    include: CON_CATEGORIAS
  })

  // Notificar después de guardar el cambio
  await enviarNotificacionPunto({
    correoDestino: punto.usuario.correo,
    nombreUsuario: punto.usuario.nombre,
    nombrePunto: actualizado.nombre,
    estado,
    motivoRechazo: actualizado.motivo_rechazo
  })

  return actualizado
}

export const aprobar = (puntoId) => cambiarEstado(puntoId, 'aprobado')

export const rechazar = (puntoId, motivoRechazo) =>
  cambiarEstado(puntoId, 'rechazado', motivoRechazo)

// Quita la marca de revisión prioritaria (HU-23). Las reseñas
// negativas anteriores a esta fecha ya no vuelven a marcar el punto.
export async function marcarRevisado(puntoId) {
  const punto = await prisma.punto.findUnique({ where: { id: puntoId } })
  if (!punto) {
    throw new HttpError(404, 'Punto no encontrado')
  }

  return prisma.punto.update({
    where: { id: puntoId },
    data: {
      revision_prioritaria: false,
      motivo_revision: null,
      fecha_revision: new Date()
    },
    include: CON_CATEGORIAS
  })
}

// Elimina el punto con sus reseñas, reportes, entregas y categorías
export async function eliminar(puntoId) {
  const punto = await prisma.punto.findUnique({ where: { id: puntoId } })
  if (!punto) {
    throw new HttpError(404, 'Punto no encontrado')
  }

  const fotos = await prisma.entrega.findMany({
    where: { punto_id: puntoId, foto_url: { not: null } },
    select: { foto_url: true }
  })

  await prisma.$transaction([
    prisma.resena.deleteMany({ where: { punto_id: puntoId } }),
    prisma.reporte.deleteMany({ where: { punto_id: puntoId } }),
    prisma.entrega.deleteMany({ where: { punto_id: puntoId } }),
    prisma.puntoCategoria.deleteMany({ where: { punto_id: puntoId } }),
    prisma.punto.delete({ where: { id: puntoId } })
  ])

  // Las fotos se borran del disco solo si la transacción se completó
  await borrarFotos(fotos.map((f) => f.foto_url))

  return { mensaje: 'Punto eliminado correctamente' }
}
