// =========================================================
// APLICAR MIGRACIONES DE PRISMA
// =========================================================
// - Base de datos nueva: crea todas las tablas (0_init y siguientes).
// - Base de datos creada por el backend anterior (FastAPI), que ya
//   tiene las tablas pero no la tabla _prisma_migrations: marca
//   0_init como aplicada (baseline) y aplica solo las siguientes.

import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

const BASELINE = '0_init'

const prisma = new PrismaClient()

async function necesitaBaseline() {
  const [fila] = await prisma.$queryRaw`
    SELECT
      to_regclass('public.usuarios') IS NOT NULL AS tiene_tablas,
      to_regclass('public._prisma_migrations') IS NOT NULL AS tiene_migraciones
  `
  return fila.tiene_tablas && !fila.tiene_migraciones
}

function prismaCli(args) {
  execSync(`npx prisma ${args}`, { stdio: 'inherit' })
}

try {
  if (await necesitaBaseline()) {
    console.log(`Base de datos existente detectada: marcando ${BASELINE} como aplicada`)
    prismaCli(`migrate resolve --applied ${BASELINE}`)
  }
} finally {
  await prisma.$disconnect()
}

prismaCli('migrate deploy')
