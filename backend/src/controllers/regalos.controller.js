// =========================================================
// CONTROLADOR DE REGALOS Y CONVERSACIONES
// =========================================================

import { rutaPublicaFoto } from '../middlewares/subirFoto.js'
import * as regalosService from '../services/regalos.service.js'
import { CATEGORIAS_REGALO } from '../validators/regalos.schemas.js'

// ---------- Regalos ----------

export async function listar(req, res) {
  const categoria = CATEGORIAS_REGALO.includes(req.query.categoria) ? req.query.categoria : undefined
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 80) : undefined
  res.json(await regalosService.listarDisponibles({ categoria, q }, req.usuario?.id ?? null))
}

export async function obtener(req, res) {
  res.json(await regalosService.obtener(req.params.regalo_id, req.usuario))
}

export async function listarMios(req, res) {
  res.json(await regalosService.listarMios(req.usuario.id))
}

export async function crear(req, res) {
  const fotos = (req.files ?? []).map(rutaPublicaFoto)
  res.status(201).json(await regalosService.crear(req.usuario.id, req.body, fotos))
}

export async function editar(req, res) {
  res.json(await regalosService.editar(req.params.regalo_id, req.usuario.id, req.body))
}

export async function reservar(req, res) {
  res.json(await regalosService.reservar(req.params.regalo_id, req.usuario.id, req.body.interesado_id))
}

export async function liberar(req, res) {
  res.json(await regalosService.liberar(req.params.regalo_id, req.usuario.id))
}

export async function entregar(req, res) {
  res.json(await regalosService.entregar(req.params.regalo_id, req.usuario.id))
}

export async function cancelar(req, res) {
  res.json(await regalosService.cancelar(req.params.regalo_id, req.usuario.id))
}

export async function renovar(req, res) {
  res.json(await regalosService.renovar(req.params.regalo_id, req.usuario.id))
}

export async function iniciarConversacion(req, res) {
  res.json(await regalosService.iniciarConversacion(req.params.regalo_id, req.usuario))
}

export async function reportar(req, res) {
  res.json(await regalosService.reportar(req.params.regalo_id, req.usuario.id, req.body))
}

// ---------- Conversaciones ----------

export async function listarConversaciones(req, res) {
  res.json(await regalosService.listarConversaciones(req.usuario.id))
}

export async function contarNoLeidos(req, res) {
  res.json({ total: await regalosService.contarNoLeidos(req.usuario.id) })
}

export async function obtenerConversacion(req, res) {
  const antesDe = Number.parseInt(req.query.antes_de, 10) || undefined
  const limite = Number.parseInt(req.query.limite, 10) || undefined
  res.json(await regalosService.obtenerConversacion(req.params.conversacion_id, req.usuario.id, { antesDe, limite }))
}

// Alternativa por REST si el socket no está conectado
export async function enviarMensaje(req, res) {
  res.json(await regalosService.enviarMensaje(req.params.conversacion_id, req.usuario.id, req.body.texto))
}

export async function marcarLeidos(req, res) {
  res.json(await regalosService.marcarLeidos(req.params.conversacion_id, req.usuario.id))
}

// ---------- Administración ----------

export async function listarReportesAdmin(_req, res) {
  res.json(await regalosService.listarReportesAdmin())
}

export async function revisarReporteAdmin(req, res) {
  res.json(await regalosService.revisarReporteAdmin(req.params.reporte_id, req.body))
}

export async function ocultarAdmin(req, res) {
  res.json(await regalosService.ocultarAdmin(req.params.regalo_id, req.body))
}

export async function eliminarAdmin(req, res) {
  res.json(await regalosService.eliminarAdmin(req.params.regalo_id))
}
