import { Router } from 'express'

import * as ctrl from '../controllers/entregas.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { registroEntregaSchema } from '../validators/entregas.schemas.js'

const router = Router()

router.use(requireAuth)

router.post('/', validate({ body: registroEntregaSchema }), ctrl.registrar)
router.get('/mis-entregas', ctrl.listarMisEntregas)

export default router
