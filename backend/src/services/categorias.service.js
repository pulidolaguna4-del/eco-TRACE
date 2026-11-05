// =========================================================
// SERVICIO DE CATEGORÍAS
// =========================================================

import { prisma } from '../config/prisma.js'

export const CATEGORIAS_INICIALES = [
  'Reciclaje Tradicional',
  'Donación de Ropa',
  'Residuos Electrónicos'
]

// Crea las categorías iniciales si la tabla está vacía
export async function sembrarCategorias() {
  if ((await prisma.categoria.count()) > 0) return

  await prisma.categoria.createMany({
    data: CATEGORIAS_INICIALES.map((nombre) => ({ nombre })),
    skipDuplicates: true
  })
}
