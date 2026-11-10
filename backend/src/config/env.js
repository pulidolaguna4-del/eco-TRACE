// =========================================================
// CONFIGURACIÓN (VARIABLES DE ENTORNO)
// =========================================================

import 'dotenv/config'

function requerida(nombre, mensaje) {
  const valor = process.env[nombre]
  if (!valor) {
    throw new Error(mensaje ?? `No se encontró ${nombre} en el archivo .env`)
  }
  return valor
}

const emailUser = process.env.EMAIL_USER
const emailPassword = process.env.EMAIL_PASSWORD

if (!emailUser || !emailPassword) {
  throw new Error('No se configuró EMAIL_USER o EMAIL_PASSWORD en el archivo .env')
}

export const config = {
  port: Number(process.env.PORT ?? 8000),

  databaseUrl: requerida('DATABASE_URL'),

  jwt: {
    secret: requerida('SECRET_KEY'),
    algorithm: 'HS256'
  },

  // HU-23: un punto se marca para revisión prioritaria cuando recibe
  // `umbralNegativas` reseñas de 1 o 2 estrellas en los últimos `diasRecientes` días
  resenas: {
    umbralNegativas: Number(process.env.UMBRAL_RESENAS_NEGATIVAS ?? 3),
    diasRecientes: Number(process.env.DIAS_RESENAS_RECIENTES ?? 30),
    puntuacionNegativa: 2
  },

  email: {
    host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT ?? 587),
    user: emailUser,
    password: emailPassword
  },

  // Orígenes permitidos: localhost / 127.0.0.1 en cualquier puerto
  // y túneles de VS Code (devtunnels)
  corsOrigin: /^(http:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?|https:\/\/.*\.devtunnels\.ms)$/
}
