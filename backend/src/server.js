// =========================================================
// PUNTO DE ENTRADA DEL SERVIDOR
// =========================================================

import { app } from './app.js'
import { config } from './config/env.js'
import { prisma } from './config/prisma.js'
import { sembrarCategorias } from './services/categorias.service.js'

async function iniciar() {
  await prisma.$connect()
  await sembrarCategorias()

  const servidor = app.listen(config.port, '0.0.0.0', () => {
    console.log(`API de Eco-TRACE escuchando en http://0.0.0.0:${config.port}`)
  })

  const apagar = async () => {
    servidor.close()
    await prisma.$disconnect()
    process.exit(0)
  }
  process.on('SIGTERM', apagar)
  process.on('SIGINT', apagar)
}

iniciar().catch(async (error) => {
  console.error('No se pudo iniciar la API:', error)
  await prisma.$disconnect()
  process.exit(1)
})
