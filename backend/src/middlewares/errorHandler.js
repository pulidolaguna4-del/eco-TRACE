// =========================================================
// MANEJO DE ERRORES
// =========================================================

import { HttpError } from '../utils/HttpError.js'
import { borrarArchivoSubido } from './subirFoto.js'

export function notFound(_req, res) {
  res.status(404).json({ detail: 'Not Found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, _next) {
  // Si la petición falló, no dejar en disco la foto que se alcanzó a subir
  borrarArchivoSubido(req)

  if (error instanceof HttpError) {
    return res.status(error.status).json({ detail: error.detail })
  }

  // JSON mal formado en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(422).json({
      detail: [{ type: 'json_invalid', loc: ['body'], msg: 'JSON decode error', input: {} }]
    })
  }

  console.error('ERROR NO CONTROLADO:', error)
  res.status(500).json({ detail: 'Internal Server Error' })
}
