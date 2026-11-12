// =========================================================
// CONTROLADOR DE REPORTES
// =========================================================

import * as reportesService from '../services/reportes.service.js'
import { fecha, reporteUsuario } from '../utils/serializers.js'

// Reportes del usuario con la respuesta del administrador
export async function listarMisReportes(req, res) {
  const reportes = await reportesService.listarDeUsuario(req.usuario.id)
  res.json(reportes.map(reporteUsuario))
}

export async function registrar(req, res) {
  const reporte = await reportesService.registrar(req.usuario.id, req.body)

  res.json({
    mensaje: 'Reporte registrado correctamente',
    reporte: {
      id: reporte.id,
      punto_id: reporte.punto_id,
      estado: reporte.estado,
      fecha_creacion: fecha(reporte.fecha_creacion)
    }
  })
}
