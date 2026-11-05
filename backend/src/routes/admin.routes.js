import { Router } from 'express'

import * as ctrl from '../controllers/admin.controller.js'
import { requireAdmin, requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { idParam } from '../validators/comunes.js'
import { rechazoPuntoSchema } from '../validators/puntos.schemas.js'
import { revisionReporteSchema } from '../validators/reportes.schemas.js'

const router = Router()

// Todas las rutas de /admin requieren un administrador
router.use(requireAuth, requireAdmin)

const usuarioId = validate({ params: idParam('usuario_id') })
const puntoId = validate({ params: idParam('punto_id') })
const reporteId = validate({ params: idParam('reporte_id') })

// Usuarios
router.get('/usuarios', ctrl.listarUsuarios)
router.put('/usuarios/:usuario_id/admin', usuarioId, ctrl.alternarAdmin)
router.delete('/usuarios/:usuario_id', usuarioId, ctrl.eliminarUsuario)

// Puntos
router.get('/puntos', ctrl.listarPuntos)
router.get('/puntos/pendientes', ctrl.listarPuntosPendientes)
router.put('/puntos/:punto_id/aprobar', puntoId, ctrl.aprobarPunto)
router.put('/puntos/:punto_id/rechazar', puntoId, validate({ body: rechazoPuntoSchema }), ctrl.rechazarPunto)
router.delete('/puntos/:punto_id', puntoId, ctrl.eliminarPunto)

// Entregas
router.get('/entregas', ctrl.listarEntregas)

// Reportes
router.get('/reportes', ctrl.listarReportes)
router.put('/reportes/:reporte_id/revisar', reporteId, validate({ body: revisionReporteSchema }), ctrl.revisarReporte)

export default router
