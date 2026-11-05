// =========================================================
// CONTROLADOR DE SISTEMA (ESTADO DE LA API)
// =========================================================

import { prisma } from '../config/prisma.js'

export function inicio(_req, res) {
  res.json({ mensaje: 'API de Eco-TRACE funcionando' })
}

export async function comprobarBaseDatos(_req, res) {
  const [{ resultado }] = await prisma.$queryRaw`SELECT 1 AS resultado`
  res.json({
    mensaje: 'Conexión con PostgreSQL exitosa',
    resultado
  })
}
