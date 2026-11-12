// =========================================================
// CONTROLADOR DE ENTREGAS
// =========================================================

import { rutaPublicaFoto } from '../middlewares/subirFoto.js'
import * as entregasService from '../services/entregas.service.js'
import * as serializar from '../utils/serializers.js'

export async function registrar(req, res) {
  // La foto solo puede venir del archivo subido, no de una URL del cliente
  const fotoUrl = req.file ? rutaPublicaFoto(req.file) : null
  const entrega = await entregasService.registrar(req.usuario.id, { ...req.body, foto_url: fotoUrl })
  res.json(serializar.entrega(entrega))
}

export async function listarMisEntregas(req, res) {
  const entregas = await entregasService.listarDeUsuario(req.usuario.id)
  res.json(entregas.map(serializar.entrega))
}
