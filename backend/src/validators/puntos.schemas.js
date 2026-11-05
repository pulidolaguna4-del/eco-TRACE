import { z } from 'zod'

import { decimal, textoOpcional } from './comunes.js'

export const registroPuntoSchema = z.object({
  nombre: z.string(),
  descripcion: z.string(),
  direccion: z.string(),
  localidad: z.string(),
  categorias: z.array(z.string()),
  latitud: decimal,
  longitud: decimal,
  foto_url: textoOpcional
})

// El cuerpo es opcional: PUT /admin/puntos/:id/rechazar puede ir vacío
export const rechazoPuntoSchema = z
  .object({ motivo_rechazo: textoOpcional })
  .nullish()
