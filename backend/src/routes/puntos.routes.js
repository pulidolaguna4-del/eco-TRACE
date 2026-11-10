import { Router } from 'express'

import * as ctrl from '../controllers/puntos.controller.js'
import { optionalAuth, requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { idParam } from '../validators/comunes.js'
import { registroPuntoSchema } from '../validators/puntos.schemas.js'
import { resenaSchema } from '../validators/resenas.schemas.js'

const router = Router()

const puntoId = idParam('punto_id')

router.get('/', ctrl.listarAprobados)
router.get('/mis-puntos', requireAuth, ctrl.listarMisPuntos)
router.post('/', requireAuth, validate({ body: registroPuntoSchema }), ctrl.registrar)

// Reseñas: cualquiera las lee; con sesión se incluye la reseña propia.
// PUT crea la reseña o edita la existente (una por usuario y punto).
router.get('/:punto_id/resenas', validate({ params: puntoId }), optionalAuth, ctrl.listarResenas)
router.put('/:punto_id/resenas', requireAuth, validate({ params: puntoId, body: resenaSchema }), ctrl.guardarResena)
router.delete('/:punto_id/resenas', requireAuth, validate({ params: puntoId }), ctrl.eliminarResena)

export default router
