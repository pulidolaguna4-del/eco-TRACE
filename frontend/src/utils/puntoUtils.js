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

/**
 * Convierte respuestas de error de la API (como los arreglos/objetos detail de FastAPI/Pydantic)
 * en un mensaje de texto plano, amigable y legible para el usuario.
 */
export function formatearMensajeError(detail, fallback = 'Ocurrió un error inesperado') {
  if (!detail) return fallback
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const mensajes = detail.map((item) => {
      if (typeof item === 'string') return item
      if (typeof item === 'object' && item !== null) {
        const campo = Array.isArray(item.loc)
          ? item.loc[item.loc.length - 1]
          : ''
        const msg = item.msg || 'error de validación'
        if (
          msg.toLowerCase().includes('field required') ||
          msg.toLowerCase().includes('field_required')
        ) {
          return campo
            ? `El campo '${campo}' es obligatorio.`
            : 'Un campo obligatorio no fue proporcionado.'
        }
        return campo ? `El campo '${campo}': ${msg}` : msg
      }
      return String(item)
    })
    return mensajes.join(' ')
  }

  if (typeof detail === 'object' && detail !== null) {
    if (detail.msg) return detail.msg
    if (detail.message) return detail.message
    try {
      return JSON.stringify(detail)
    } catch {
      return fallback
    }
  }

  return String(detail)
}
