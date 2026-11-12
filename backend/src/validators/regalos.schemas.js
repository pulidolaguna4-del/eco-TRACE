import { z } from 'zod'

import { decimal, entero } from './comunes.js'

export const CATEGORIAS_REGALO = [
  'madera',
  'papel_carton',
  'plastico',
  'vidrio',
  'metal',
  'ropa',
  'electronicos',
  'muebles',
  'otro'
]

export const UNIDADES_REGALO = ['kg', 'unidades']

const textoOpcional = (maximo) =>
  z
    .string()
    .max(maximo, `String should have at most ${maximo} characters`)
    .nullish()

// Llega como multipart/form-data: los números vienen como texto
export const crearRegaloSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'String should have at least 3 characters')
    .max(80, 'String should have at most 80 characters'),
  descripcion: textoOpcional(500),
  categoria: z.enum(CATEGORIAS_REGALO),
  cantidad: decimal,
  unidad: z.enum(UNIDADES_REGALO),
  latitud: decimal,
  longitud: decimal,
  barrio: textoOpcional(80),
  // "true" cuando la persona confirma que no es un objeto prohibido
  acepta_reglas: z.union([z.literal('true'), z.literal(true)])
})

export const editarRegaloSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'String should have at least 3 characters')
    .max(80, 'String should have at most 80 characters')
    .optional(),
  descripcion: textoOpcional(500),
  cantidad: decimal.optional(),
  unidad: z.enum(UNIDADES_REGALO).optional(),
  barrio: textoOpcional(80)
})

export const reservarRegaloSchema = z.object({
  interesado_id: entero
})

export const mensajeSchema = z.object({
  texto: z.string().max(1000, 'String should have at most 1000 characters')
})

export const reporteRegaloSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, 'String should have at least 5 characters')
    .max(500, 'String should have at most 500 characters'),
  mensaje_id: entero.nullish()
})

export const revisionReporteRegaloSchema = z.object({
  estado: z.enum(['revisado', 'descartado']),
  observacion_admin: textoOpcional(500)
})

export const ocultarRegaloSchema = z.object({
  oculto: z.boolean(),
  motivo: textoOpcional(500)
})
