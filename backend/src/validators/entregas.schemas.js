import { z } from 'zod'

import { decimal, entero, textoOpcional } from './comunes.js'

export const ESTADOS_CONSERVACION = ['nuevo', 'bueno', 'regular', 'danado']

export const ESTADOS_ENTREGA = ['pendiente', 'verificada', 'rechazada']

export const registroEntregaSchema = z.object({
  punto_id: entero,
  // Nombre de una de las categorías del punto (ej. "Donación de Ropa").
  // Si no se envía, se deduce del tipo o de la única categoría del punto.
  categoria: textoOpcional,
  tipo: textoOpcional,
  nombre_articulo: z
    .string()
    .max(120, 'String should have at most 120 characters')
    .nullish(),
  cantidad: decimal,
  unidad: z.string(),
  // Peso en kg. Obligatorio solo si la unidad no es "kg".
  peso: decimal.nullish(),
  estado_conservacion: z.enum(ESTADOS_CONSERVACION).nullish(),
  foto_url: z
    .string()
    .max(500, 'String should have at most 500 characters')
    .nullish(),
  observacion: textoOpcional
})

export const revisionEntregaSchema = z.object({
  estado: z.enum(ESTADOS_ENTREGA),
  observacion_admin: z
    .string()
    .max(500, 'String should have at most 500 characters')
    .nullish()
})
