/**
 * Capa de adaptación temporal para Puntos Ecológicos.
 *
 * NOTA TEMPORAL: El backend actual sólo retorna `tipo` (string único, ej. "Reciclaje").
 * Esta función normaliza el objeto agregando un arreglo `categorias`, de modo que la UI
 * trabaje siempre internamente con múltiples categorías.
 *
 * CUANDO EL BACKEND SE ACTUALICE:
 * Cuando el backend retorne nativamente `categorias: string[]`, se puede simplificar
 * o eliminar esta función, asegurando que `punto.categorias` venga del API.
 */

export const CATEGORIAS_DISPONIBLES = [
  {
    id: 'Reciclaje Tradicional',
    nombre: 'Reciclaje Tradicional',
    icono: '♻️',
    color: '#218739'
  },
  {
    id: 'Donación de Ropa',
    nombre: 'Donación de Ropa',
    icono: '👕',
    color: '#1976d2'
  },
  {
    id: 'Residuos Electrónicos',
    nombre: 'Residuos Electrónicos',
    icono: '💻',
    color: '#7b1fa2'
  }
]

export function normalizarPunto(punto) {
  if (!punto) return punto

  let categorias = []

  if (Array.isArray(punto.categorias) && punto.categorias.length > 0) {
    categorias = punto.categorias
  } else if (punto.tipo) {
    categorias = [punto.tipo]
  }

  return {
    ...punto,
    categorias
  }
}

export function obtenerIconoYColorPorCategorias(categorias = []) {
  if (!categorias || categorias.length === 0) {
    return { emoji: '📍', color: '#218739' }
  }

  const catNormalizadas = categorias.map((c) => c.toLowerCase())

  const tieneReciclaje = catNormalizadas.some((c) => c.includes('recicl'))
  const tieneRopa = catNormalizadas.some((c) => c.includes('ropa'))
  const tieneElectronicos = catNormalizadas.some((c) => c.includes('electr'))

  if (catNormalizadas.length > 1) {
    return { emoji: '🌟', color: '#10b981' } // Icono compuesto o multicanal
  }

  if (tieneReciclaje) return { emoji: '♻️', color: '#218739' }
  if (tieneRopa) return { emoji: '👕', color: '#1976d2' }
  if (tieneElectronicos) return { emoji: '💻', color: '#7b1fa2' }

  return { emoji: '📍', color: '#218739' }
}
