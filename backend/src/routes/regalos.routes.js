import { Router } from 'express'

import * as ctrl from '../controllers/regalos.controller.js'
import { optionalAuth, requireAuth } from '../middlewares/auth.js'
import { subirFotosRegalo } from '../middlewares/subirFoto.js'
import { validate } from '../middlewares/validate.js'
import { idParam } from '../validators/comunes.js'
import {
  crearRegaloSchema,
  editarRegaloSchema,
  reporteRegaloSchema,
  reservarRegaloSchema
} from '../validators/regalos.schemas.js'

const router = Router()
const regaloId = validate({ params: idParam('regalo_id') })

// Públicas (con sesión se marcan "es_mio" y la conversación propia)
router.get('/', optionalAuth, ctrl.listar)
router.get('/mios', requireAuth, ctrl.listarMios)
router.get('/:regalo_id', regaloId, optionalAuth, ctrl.obtener)

// multipart/form-data: datos + hasta 3 fotos en el campo "fotos"
router.post('/', requireAuth, subirFotosRegalo, validate({ body: crearRegaloSchema }), ctrl.crear)
router.put('/:regalo_id', requireAuth, regaloId, validate({ body: editarRegaloSchema }), ctrl.editar)

// Estados (solo quien lo publicó)
router.put('/:regalo_id/reservar', requireAuth, regaloId, validate({ body: reservarRegaloSchema }), ctrl.reservar)
router.put('/:regalo_id/liberar', requireAuth, regaloId, ctrl.liberar)
router.put('/:regalo_id/entregar', requireAuth, regaloId, ctrl.entregar)
router.put('/:regalo_id/cancelar', requireAuth, regaloId, ctrl.cancelar)
router.put('/:regalo_id/renovar', requireAuth, regaloId, ctrl.renovar)

// "Me interesa" y reportes
router.post('/:regalo_id/conversacion', requireAuth, regaloId, ctrl.iniciarConversacion)
router.post('/:regalo_id/reportes', requireAuth, regaloId, validate({ body: reporteRegaloSchema }), ctrl.reportar)

export default router
