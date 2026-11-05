// =========================================================
// VALIDACIÓN DE DATOS (ZOD)
// =========================================================
// Valida req.body / req.params con un esquema de Zod. Si falla,
// responde 422 con el mismo formato que usaba FastAPI/Pydantic:
//   { "detail": [ { "type", "loc": ["body", "campo"], "msg", "input" } ] }

import { HttpError } from '../utils/HttpError.js'

function aDetallePydantic(error, ubicacion, datos) {
  return error.issues.map((issue) => {
    const faltante =
      issue.code === 'invalid_type' && issue.received === 'undefined'

    return {
      type: faltante ? 'missing' : issue.code,
      loc: [ubicacion, ...issue.path],
      msg: faltante ? 'Field required' : issue.message,
      input: issue.path.length
        ? issue.path.reduce((obj, clave) => obj?.[clave], datos)
        : datos
    }
  })
}

export function validate({ body, params }) {
  return (req, _res, next) => {
    if (params) {
      const resultado = params.safeParse(req.params)
      if (!resultado.success) {
        throw new HttpError(422, aDetallePydantic(resultado.error, 'path', req.params))
      }
      req.params = resultado.data
    }

    if (body) {
      const datos = req.body ?? {}
      const resultado = body.safeParse(datos)
      if (!resultado.success) {
        throw new HttpError(422, aDetallePydantic(resultado.error, 'body', datos))
      }
      req.body = resultado.data
    }

    next()
  }
}
