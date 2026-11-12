import { Router } from 'express'

import * as sistema from '../controllers/sistema.controller.js'
import adminRoutes from './admin.routes.js'
import conversacionesRoutes from './conversaciones.routes.js'
import entregasRoutes from './entregas.routes.js'
import impactoRoutes from './impacto.routes.js'
import puntosRoutes from './puntos.routes.js'
import regalosRoutes from './regalos.routes.js'
import reportesRoutes from './reportes.routes.js'
import usuariosRoutes from './usuarios.routes.js'

const router = Router()

router.get('/', sistema.inicio)
router.get('/db', sistema.comprobarBaseDatos)

router.use('/usuarios', usuariosRoutes)
router.use('/puntos', puntosRoutes)
router.use('/entregas', entregasRoutes)
router.use('/reportes', reportesRoutes)
router.use('/impacto', impactoRoutes)
router.use('/regalos', regalosRoutes)
router.use('/conversaciones', conversacionesRoutes)
router.use('/admin', adminRoutes)

export default router
