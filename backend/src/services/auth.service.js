// =========================================================
// SERVICIO DE AUTENTICACIÓN
// Registro, login y recuperación de contraseña
// =========================================================

import { randomInt } from 'node:crypto'

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'
import { crearToken } from '../utils/jwt.js'
import { hashPassword, verificarPassword } from '../utils/password.js'
import { enviarCorreoRecuperacion } from './email.service.js'

const HORAS_VALIDEZ_CODIGO = 24

export async function registrar({ nombre, correo, password }) {
  const existente = await prisma.usuario.findUnique({ where: { correo } })
  if (existente) {
    throw new HttpError(400, 'El correo ya está registrado')
  }

  return prisma.usuario.create({
    data: {
      nombre,
      correo,
      password: await hashPassword(password),
      es_admin: false
    }
  })
}

export async function login({ correo, password }) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } })

  if (!usuario || !(await verificarPassword(password, usuario.password))) {
    throw new HttpError(401, 'Correo o contraseña incorrectos')
  }

  return {
    access_token: crearToken(usuario),
    token_type: 'bearer',
    usuario
  }
}

// ---------------------------------------------------------
// Recuperación de contraseña
// ---------------------------------------------------------

async function buscarPorCorreo(correo, mensaje) {
  const usuario = await prisma.usuario.findUnique({ where: { correo } })
  if (!usuario) throw new HttpError(404, mensaje)
  return usuario
}

async function obtenerCodigoValido(usuarioId, codigo) {
  const registro = await prisma.codigoRecuperacion.findFirst({
    where: { usuario_id: usuarioId, codigo, utilizado: false }
  })

  if (!registro) {
    throw new HttpError(400, 'Código incorrecto o ya utilizado')
  }

  if (new Date() > new Date(registro.fecha_expiracion)) {
    throw new HttpError(400, 'El código ha expirado')
  }

  return registro
}

export async function solicitarRecuperacion({ correo }) {
  const usuario = await buscarPorCorreo(correo, 'No existe una cuenta con ese correo')

  // Código de 6 dígitos
  const codigo = String(randomInt(100000, 1000000))

  // Se guarda como texto ISO 8601 con zona horaria (igual que antes)
  const fechaExpiracion = new Date(
    Date.now() + HORAS_VALIDEZ_CODIGO * 60 * 60 * 1000
  ).toISOString()

  await prisma.$transaction([
    // Invalidar códigos anteriores
    prisma.codigoRecuperacion.updateMany({
      where: { usuario_id: usuario.id, utilizado: false },
      data: { utilizado: true }
    }),
    prisma.codigoRecuperacion.create({
      data: {
        usuario_id: usuario.id,
        codigo,
        fecha_expiracion: fechaExpiracion,
        utilizado: false
      }
    })
  ])

  // Enviar correo después de guardar el código
  await enviarCorreoRecuperacion(correo, codigo)

  return { mensaje: 'Se envió un código de recuperación al correo' }
}

export async function verificarCodigo({ correo, codigo }) {
  const usuario = await buscarPorCorreo(correo, 'No existe una cuenta con ese correo')
  await obtenerCodigoValido(usuario.id, codigo)
  return { mensaje: 'Código correcto' }
}

export async function restablecerContrasena({ correo, codigo, nueva_password }) {
  const usuario = await buscarPorCorreo(correo, 'Usuario no encontrado')
  const registro = await obtenerCodigoValido(usuario.id, codigo)

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: await hashPassword(nueva_password) }
    }),
    prisma.codigoRecuperacion.update({
      where: { id: registro.id },
      data: { utilizado: true }
    })
  ])

  return { mensaje: 'Contraseña actualizada correctamente' }
}
