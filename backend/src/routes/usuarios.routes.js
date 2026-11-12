import { Router } from 'express'

import * as ctrl from '../controllers/usuarios.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import * as schemas from '../validators/usuarios.schemas.js'

const router = Router()

// Autenticación
router.post('/registro', validate({ body: schemas.registroSchema }), ctrl.registrar)
router.post('/login', validate({ body: schemas.loginSchema }), ctrl.login)
router.post('/google', validate({ body: schemas.googleSchema }), ctrl.loginConGoogle)

// Recuperación de contraseña
router.post('/recuperar', validate({ body: schemas.solicitarRecuperacionSchema }), ctrl.solicitarRecuperacion)
router.post('/verificar-codigo', validate({ body: schemas.verificarCodigoSchema }), ctrl.verificarCodigo)
router.post('/nueva-contrasena', validate({ body: schemas.nuevaContrasenaSchema }), ctrl.restablecerContrasena)

// Usuario autenticado
router.get('/', requireAuth, ctrl.listar)
router.get('/me', requireAuth, ctrl.obtenerMiUsuario)
router.put('/me', requireAuth, validate({ body: schemas.actualizarPerfilSchema }), ctrl.actualizarMiPerfil)
router.put('/me/contrasena', requireAuth, validate({ body: schemas.cambiarContrasenaPerfilSchema }), ctrl.cambiarMiContrasena)

export default router
