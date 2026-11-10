// =========================================================
// CONTROLADOR DEL DASHBOARD DE IMPACTO
// =========================================================

import * as impactoService from '../services/impacto.service.js'

export async function obtener(req, res) {
  const categoria = typeof req.query.categoria === 'string' && req.query.categoria.trim()
    ? req.query.categoria.trim()
    : null

  res.json(
    await impactoService.obtener({
      categoria,
      esAdmin: Boolean(req.usuario?.es_admin)
    })
  )
}
