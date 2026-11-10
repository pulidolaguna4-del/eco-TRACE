import { Router } from 'express'

import * as ctrl from '../controllers/impacto.controller.js'
import { optionalAuth } from '../middlewares/auth.js'

const router = Router()

// Público. Si quien consulta es administrador, incluye datos extra.
router.get('/', optionalAuth, ctrl.obtener)

export default router
