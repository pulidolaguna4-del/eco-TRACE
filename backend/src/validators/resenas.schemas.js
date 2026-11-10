import { z } from 'zod'

import { enteroEntre } from './comunes.js'

export const resenaSchema = z.object({
  puntuacion: enteroEntre(1, 5),
  // Opcional: se puede calificar solo con estrellas
  comentario: z
    .string()
    .max(500, 'String should have at most 500 characters')
    .nullish()
})
