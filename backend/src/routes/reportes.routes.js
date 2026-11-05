import { Router } from 'express'

import * as ctrl from '../controllers/reportes.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { registroReporteSchema } from '../validators/reportes.schemas.js'

const router = Router()

router.post('/', requireAuth, validate({ body: registroReporteSchema }), ctrl.registrar)

export default router
