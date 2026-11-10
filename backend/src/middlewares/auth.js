// =========================================================
// AUTENTICACIÓN Y PERMISOS
// =========================================================
// requireAuth  -> equivalente a Depends(obtener_usuario_actual)
// requireAdmin -> equivalente a Depends(obtener_admin_actual)

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'
import { verificarToken } from '../utils/jwt.js'

export async function requireAuth(req, _res, next) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ')

  if (esquema?.toLowerCase() !== 'bearer' || !token) {
    throw new HttpError(401, 'Not authenticated')
  }

  let datos
  try {
    datos = verificarToken(token)
  } catch {
    throw new HttpError(401, 'Token inválido o expirado')
  }

  const usuarioId = Number.parseInt(datos.sub, 10)
  if (!usuarioId) {
    throw new HttpError(401, 'Token inválido')
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
  if (!usuario) {
    throw new HttpError(401, 'Usuario no encontrado')
  }

  req.usuario = usuario
  next()
}

// Para rutas públicas que muestran más datos a usuarios autenticados.
// Sin token, o con un token inválido, sigue como visitante anónimo.
export async function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next()

  try {
    await requireAuth(req, res, () => {})
  } catch {
    req.usuario = undefined
  }
  next()
}

export function requireAdmin(req, _res, next) {
  if (!req.usuario?.es_admin) {
    throw new HttpError(403, 'No tienes permisos de administrador')
  }
  next()
}
