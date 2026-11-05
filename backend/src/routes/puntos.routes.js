import { Router } from 'express'

import * as ctrl from '../controllers/puntos.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { registroPuntoSchema } from '../validators/puntos.schemas.js'

const router = Router()

router.get('/', ctrl.listarAprobados)
router.get('/mis-puntos', requireAuth, ctrl.listarMisPuntos)
router.post('/', requireAuth, validate({ body: registroPuntoSchema }), ctrl.registrar)

export default router
