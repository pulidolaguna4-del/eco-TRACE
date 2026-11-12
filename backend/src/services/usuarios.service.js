// =========================================================
// SERVICIO DE USUARIOS
// =========================================================

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'
import { borrarFotos } from '../utils/archivos.js'
import { hashPassword, verificarPassword } from '../utils/password.js'
import { recalcular as recalcularCalificacion } from './resenas.service.js'

export function listar() {
  return prisma.usuario.findMany({ orderBy: { id: 'asc' } })
}

export async function actualizarPerfil(usuarioId, { nombre, correo }) {
  const correoEnUso = await prisma.usuario.findFirst({
    where: { correo, id: { not: usuarioId } }
  })

  if (correoEnUso) {
    throw new HttpError(400, 'El correo ya está registrado por otro usuario')
  }

  return prisma.usuario.update({
    where: { id: usuarioId },
    data: { nombre, correo }
  })
}

export async function cambiarContrasena(usuario, { password_actual, nueva_password }) {
  if (nueva_password.trim().length < 8) {
    throw new HttpError(400, 'La nueva contraseña debe tener al menos 8 caracteres')
  }

  if (!usuario.password) {
    throw new HttpError(
      400,
      'Tu cuenta usa Google y no tiene contraseña. Para crear una, usa "¿Olvidaste tu contraseña?" en el inicio de sesión.'
    )
  }

  if (password_actual === nueva_password) {
    throw new HttpError(400, 'La nueva contraseña debe ser diferente a la actual')
  }

  if (!(await verificarPassword(password_actual, usuario.password))) {
    throw new HttpError(400, 'La contraseña actual es incorrecta')
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { password: await hashPassword(nueva_password) }
  })

  return { mensaje: 'Contraseña actualizada correctamente' }
}

// ---------------------------------------------------------
// Administración
// ---------------------------------------------------------

async function obtenerOtroUsuario(usuarioId, adminId, mensajePropio) {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado')
  if (usuario.id === adminId) throw new HttpError(400, mensajePropio)
  return usuario
}

// Convierte / quita permisos de administrador
export async function alternarAdmin(usuarioId, adminId) {
  const usuario = await obtenerOtroUsuario(
    usuarioId,
    adminId,
    'No puedes cambiar tus propios permisos de administrador'
  )

  return prisma.usuario.update({
    where: { id: usuario.id },
    data: { es_admin: !usuario.es_admin }
  })
}

// Elimina el usuario junto con sus puntos, entregas, reportes, reseñas y códigos
export async function eliminarConDatos(usuarioId, adminId) {
  const usuario = await obtenerOtroUsuario(
    usuarioId,
    adminId,
    'No puedes eliminar tu propia cuenta desde el panel de administración'
  )

  const puntos = await prisma.punto.findMany({
    where: { usuario_id: usuario.id },
    select: { id: true }
  })
  const puntosIds = puntos.map((p) => p.id)

  // Lo creado por el usuario o asociado a sus puntos
  const delUsuarioOSusPuntos = {
    OR: [{ usuario_id: usuario.id }, { punto_id: { in: puntosIds } }]
  }

  // Puntos de otros usuarios que este calificó: hay que recalcular su promedio
  const calificados = await prisma.resena.findMany({
    where: { usuario_id: usuario.id, punto_id: { notIn: puntosIds } },
    select: { punto_id: true }
  })

  const fotos = await prisma.entrega.findMany({
    where: { ...delUsuarioOSusPuntos, foto_url: { not: null } },
    select: { foto_url: true }
  })

  try {
    await prisma.$transaction([
      prisma.resena.deleteMany({ where: delUsuarioOSusPuntos }),
      prisma.reporte.deleteMany({ where: delUsuarioOSusPuntos }),
      prisma.entrega.deleteMany({ where: delUsuarioOSusPuntos }),
      prisma.puntoCategoria.deleteMany({ where: { punto_id: { in: puntosIds } } }),
      prisma.punto.deleteMany({ where: { id: { in: puntosIds } } }),
      prisma.codigoRecuperacion.deleteMany({ where: { usuario_id: usuario.id } }),
      prisma.usuario.delete({ where: { id: usuario.id } })
    ])
  } catch (error) {
    console.error('ERROR AL ELIMINAR USUARIO:', error)
    throw new HttpError(500, 'No se pudo eliminar el usuario y sus datos relacionados')
  }

  await borrarFotos(fotos.map((f) => f.foto_url))

  for (const { punto_id } of calificados) {
    await recalcularCalificacion(punto_id)
  }

  return { mensaje: 'Usuario y sus datos relacionados eliminados correctamente' }
}
