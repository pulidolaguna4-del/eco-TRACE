import { Router } from 'express'

import * as ctrl from '../controllers/entregas.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { subirFoto } from '../middlewares/subirFoto.js'
import { validate } from '../middlewares/validate.js'
import { registroEntregaSchema } from '../validators/entregas.schemas.js'

const router = Router()

router.use(requireAuth)

// multipart/form-data con los datos de la entrega y una foto opcional
// en el campo `foto`. También acepta JSON si no hay foto.
router.post('/', subirFoto, validate({ body: registroEntregaSchema }), ctrl.registrar)
router.get('/mis-entregas', ctrl.listarMisEntregas)

export default router
