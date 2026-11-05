import { z } from 'zod'

import { decimal, entero, textoOpcional } from './comunes.js'

export const registroEntregaSchema = z.object({
  punto_id: entero,
  tipo: z.string(),
  cantidad: decimal,
  unidad: z.string(),
  observacion: textoOpcional
})
