// =========================================================
// HASH DE CONTRASEÑAS (ARGON2ID)
// =========================================================
// Compatible con los hashes generados por pwdlib en el backend
// anterior ($argon2id$...), así que los usuarios existentes pueden
// seguir iniciando sesión.

import argon2 from 'argon2'

export function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id })
}

export async function verificarPassword(password, hash) {
  try {
    return await argon2.verify(hash, password)
  } catch {
    // Hash con formato inválido
    return false
  }
}
