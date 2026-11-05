// =========================================================
// CONTROLADOR DE REPORTES
// =========================================================

import * as reportesService from '../services/reportes.service.js'
import { fecha } from '../utils/serializers.js'

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
