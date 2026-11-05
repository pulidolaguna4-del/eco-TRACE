// =========================================================
// TOKENS JWT
// =========================================================

import jwt from 'jsonwebtoken'

import { config } from '../config/env.js'

export function crearToken(usuario) {
  return jwt.sign(
    {
      sub: String(usuario.id),
      correo: usuario.correo,
      es_admin: usuario.es_admin
    },
    config.jwt.secret,
    { algorithm: config.jwt.algorithm }
  )
}

// Lanza un error si el token es inválido
export function verificarToken(token) {
  return jwt.verify(token, config.jwt.secret, {
    algorithms: [config.jwt.algorithm]
  })
}
