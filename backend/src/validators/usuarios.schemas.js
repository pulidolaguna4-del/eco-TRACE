import { z } from 'zod'

export const registroSchema = z.object({
  nombre: z.string(),
  correo: z.string(),
  password: z.string()
})

export const loginSchema = z.object({
  correo: z.string(),
  password: z.string()
})

// ID token que Google entrega al frontend
export const googleSchema = z.object({
  credential: z.string().min(1, 'Field required').max(4096)
})

export const actualizarPerfilSchema = z.object({
  nombre: z.string(),
  correo: z.string()
})

export const cambiarContrasenaPerfilSchema = z.object({
  password_actual: z.string(),
  nueva_password: z
    .string()
    .min(8, 'String should have at least 8 characters')
})

export const solicitarRecuperacionSchema = z.object({
  correo: z.string()
})

export const verificarCodigoSchema = z.object({
  correo: z.string(),
  codigo: z.string()
})

export const nuevaContrasenaSchema = z.object({
  correo: z.string(),
  codigo: z.string(),
  nueva_password: z.string()
})
