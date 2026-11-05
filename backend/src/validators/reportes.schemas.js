import { z } from 'zod'

import { entero } from './comunes.js'

export const registroReporteSchema = z.object({
  punto_id: entero,
  motivo: z
    .string()
    .min(5, 'String should have at least 5 characters')
    .max(500, 'String should have at most 500 characters')
})

export const revisionReporteSchema = z.object({
  estado: z.string(),
  observacion_admin: z
    .string()
    .max(500, 'String should have at most 500 characters')
    .nullish()
})
