// =========================================================
// SERVICIO DE AUTENTICACIÓN
// Registro, login y recuperación de contraseña
// =========================================================

import { randomInt } from 'node:crypto'

import { OAuth2Client } from 'google-auth-library'

import { config } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'
import { crearToken } from '../utils/jwt.js'
import { hashPassword, verificarPassword } from '../utils/password.js'
import { enviarCorreoRecuperacion } from './email.service.js'

const HORAS_VALIDEZ_CODIGO = 24

export async function registrar({ nombre, correo, password }) {
  const existente = await prisma.usuario.findUnique({ where: { correo } })
  if (existente && !existente.password) {
    throw new HttpError(400, 'Este correo ya tiene una cuenta creada con Google. Usa "Continuar con Google".')
  }
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

  // Cuenta creada con Google: todavía no tiene contraseña
  if (usuario && !usuario.password) {
    throw new HttpError(
      401,
      'Esta cuenta se creó con Google. Usa "Continuar con Google" o crea una contraseña con "¿Olvidaste tu contraseña?".'
    )
  }

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
// Inicio de sesión / registro con Google
// ---------------------------------------------------------
// El frontend recibe de Google un ID token (JWT firmado por Google) y lo
// envía aquí. Nunca se confía en él sin verificarlo: firma, emisor,
// audiencia (nuestro Client ID) y vencimiento los revisa la librería.
// Luego se emite el JWT propio de eco-TRACE, igual que en el login normal.

let clienteGoogle = null

async function verificarTokenGoogle(credencial) {
  if (!config.google.clientId) {
    throw new HttpError(503, 'El inicio de sesión con Google no está configurado')
  }

  clienteGoogle ??= new OAuth2Client(config.google.clientId)

  try {
    const ticket = await clienteGoogle.verifyIdToken({
      idToken: credencial,
      audience: config.google.clientId
    })
    return ticket.getPayload()
  } catch (error) {
    console.error('TOKEN DE GOOGLE INVÁLIDO:', error.message)
    throw new HttpError(401, 'No se pudo verificar tu cuenta de Google. Inténtalo de nuevo.')
  }
}

export async function loginConGoogle({ credential }) {
  const datos = await verificarTokenGoogle(credential)

  if (!datos?.sub || !datos.email || !datos.email_verified) {
    throw new HttpError(401, 'Tu cuenta de Google no tiene un correo verificado')
  }

  const correo = datos.email.toLowerCase()
  let nuevo = false

  // 1. Ya entró antes con Google
  let usuario = await prisma.usuario.findUnique({ where: { google_id: datos.sub } })

  if (!usuario) {
    // 2. Ya tenía cuenta con ese correo: se vincula (Google confirmó que el
    //    correo es suyo)
    const porCorreo = await prisma.usuario.findFirst({
      where: { correo: { equals: correo, mode: 'insensitive' } }
    })

    if (porCorreo) {
      if (porCorreo.google_id && porCorreo.google_id !== datos.sub) {
        throw new HttpError(409, 'Este correo ya está vinculado a otra cuenta de Google')
      }
      usuario = await prisma.usuario.update({
        where: { id: porCorreo.id },
        data: { google_id: datos.sub }
      })
    } else {
      // 3. Cuenta nueva, sin contraseña
      usuario = await prisma.usuario.create({
        data: {
          nombre: (datos.name || correo.split('@')[0]).slice(0, 120),
          correo,
          password: null,
          google_id: datos.sub,
          es_admin: false
        }
      })
      nuevo = true
    }
  }

  return {
    access_token: crearToken(usuario),
    token_type: 'bearer',
    usuario,
    nuevo
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
