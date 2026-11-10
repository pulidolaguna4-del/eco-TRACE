// =========================================================
// CONTROLADOR DEL PANEL DE ADMINISTRACIÓN
// =========================================================

import * as entregasService from '../services/entregas.service.js'
import * as puntosService from '../services/puntos.service.js'
import * as reportesService from '../services/reportes.service.js'
import * as usuariosService from '../services/usuarios.service.js'
import * as serializar from '../utils/serializers.js'

// ---------- Usuarios ----------

export async function listarUsuarios(_req, res) {
  const usuarios = await usuariosService.listar()
  res.json(usuarios.map(serializar.usuario))
}

export async function alternarAdmin(req, res) {
  const usuario = await usuariosService.alternarAdmin(req.params.usuario_id, req.usuario.id)
  res.json(serializar.usuario(usuario))
}

export async function eliminarUsuario(req, res) {
  res.json(await usuariosService.eliminarConDatos(req.params.usuario_id, req.usuario.id))
}

// ---------- Puntos ----------

export async function listarPuntos(_req, res) {
  const puntos = await puntosService.listarTodos()
  res.json(puntos.map(serializar.punto))
}

export async function listarPuntosPendientes(_req, res) {
  const puntos = await puntosService.listarPendientes()
  res.json(puntos.map(serializar.punto))
}

export async function aprobarPunto(req, res) {
  const punto = await puntosService.aprobar(req.params.punto_id)
  res.json(serializar.punto(punto))
}

export async function rechazarPunto(req, res) {
  const punto = await puntosService.rechazar(
    req.params.punto_id,
    req.body?.motivo_rechazo
  )
  res.json(serializar.punto(punto))
}

export async function marcarPuntoRevisado(req, res) {
  const punto = await puntosService.marcarRevisado(req.params.punto_id)
  res.json(serializar.punto(punto))
}

export async function eliminarPunto(req, res) {
  res.json(await puntosService.eliminar(req.params.punto_id))
}

// ---------- Entregas ----------

export async function listarEntregas(_req, res) {
  const entregas = await entregasService.listarTodas()
  res.json(entregas.map(serializar.entregaAdmin))
}

export async function revisarEntrega(req, res) {
  const entrega = await entregasService.revisar(req.params.entrega_id, req.body)
  res.json(serializar.entregaAdmin(entrega))
}

// ---------- Reportes ----------

export async function listarReportes(_req, res) {
  const reportes = await reportesService.listarTodos()
  res.json(reportes.map(serializar.reporteAdmin))
}

export async function revisarReporte(req, res) {
  const reporte = await reportesService.revisar(req.params.reporte_id, req.body)

  res.json({
    mensaje: 'Reporte actualizado correctamente',
    id: reporte.id,
    estado: reporte.estado,
    observacion_admin: reporte.observacion_admin
  })
}
