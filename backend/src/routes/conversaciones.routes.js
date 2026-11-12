import { Router } from 'express'

import * as ctrl from '../controllers/regalos.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { idParam } from '../validators/comunes.js'
import { mensajeSchema } from '../validators/regalos.schemas.js'

const router = Router()
const conversacionId = validate({ params: idParam('conversacion_id') })

router.use(requireAuth)

router.get('/', ctrl.listarConversaciones)
router.get('/no-leidos', ctrl.contarNoLeidos)
router.get('/:conversacion_id', conversacionId, ctrl.obtenerConversacion)
router.post('/:conversacion_id/mensajes', conversacionId, validate({ body: mensajeSchema }), ctrl.enviarMensaje)
router.put('/:conversacion_id/leidos', conversacionId, ctrl.marcarLeidos)

export default router
