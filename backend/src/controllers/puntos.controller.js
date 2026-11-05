// =========================================================
// CONTROLADOR DE PUNTOS ECOLÓGICOS
// =========================================================

import * as puntosService from '../services/puntos.service.js'
import * as serializar from '../utils/serializers.js'

export async function registrar(req, res) {
  const punto = await puntosService.registrar(req.usuario.id, req.body)
  res.json(serializar.punto(punto))
}

export async function listarAprobados(_req, res) {
  const puntos = await puntosService.listarAprobados()
  res.json(puntos.map(serializar.punto))
}

export async function listarMisPuntos(req, res) {
  const puntos = await puntosService.listarDeUsuario(req.usuario.id)
  res.json(puntos.map(serializar.punto))
}
