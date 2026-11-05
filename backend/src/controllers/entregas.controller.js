// =========================================================
// CONTROLADOR DE ENTREGAS
// =========================================================

import * as entregasService from '../services/entregas.service.js'
import * as serializar from '../utils/serializers.js'

export async function registrar(req, res) {
  const entrega = await entregasService.registrar(req.usuario.id, req.body)
  res.json(serializar.entrega(entrega))
}

export async function listarMisEntregas(req, res) {
  const entregas = await entregasService.listarDeUsuario(req.usuario.id)
  res.json(entregas.map(serializar.entrega))
}
