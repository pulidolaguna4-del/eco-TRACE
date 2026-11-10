// =========================================================
// TIPOS DE VALIDACIÓN COMUNES
// =========================================================
// Imitan el modo "lax" de Pydantic: aceptan números enviados como
// texto ("12", "4.5") pero rechazan null, "" y valores no numéricos.

import { z } from 'zod'

const NUMERO_TEXTO = /^\s*-?\d+(\.\d+)?\s*$/

function numerico(base) {
  return z.preprocess(
    (valor) =>
      typeof valor === 'string' && NUMERO_TEXTO.test(valor) ? Number(valor) : valor,
    base
  )
}

export const entero = numerico(z.number().int())
export const decimal = numerico(z.number())

export const enteroEntre = (minimo, maximo) =>
  numerico(
    z
      .number()
      .int()
      .min(minimo, `Input should be greater than or equal to ${minimo}`)
      .max(maximo, `Input should be less than or equal to ${maximo}`)
  )

// Para parámetros de ruta como /admin/puntos/:punto_id
export const idParam = (nombre) => z.object({ [nombre]: entero })

export const textoOpcional = z.string().nullish()
