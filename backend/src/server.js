// =========================================================
// PUNTO DE ENTRADA DEL SERVIDOR
// =========================================================

import { createServer } from 'node:http'

import { app } from './app.js'
import { config } from './config/env.js'
import { prisma } from './config/prisma.js'
import { sembrarCategorias } from './services/categorias.service.js'
import { vencerRegalos } from './services/regalos.service.js'
import { iniciarTiempoReal } from './tiempoReal.js'

async function iniciar() {
  await prisma.$connect()
  await sembrarCategorias()

  // La API y el chat (Socket.IO) comparten el mismo servidor y puerto
  const servidor = createServer(app)
  const io = iniciarTiempoReal(servidor)

  servidor.listen(config.port, '0.0.0.0', () => {
    console.log(`API de Eco-TRACE escuchando en http://0.0.0.0:${config.port}`)
  })

  // Los regalos disponibles vencen a los 30 días (también se revisa al consultar)
  const intervaloVencimiento = setInterval(() => vencerRegalos().catch(console.error), 60 * 60 * 1000)

  const apagar = async () => {
    clearInterval(intervaloVencimiento)
    io.close()
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
