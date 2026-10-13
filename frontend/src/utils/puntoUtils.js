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
 * Convierte cualquier respuesta de error de FastAPI (o error JS/Red) en un string legible para React.
 * Evita renderizar objetos directamente como hijos de React.
 */
export function formatearMensajeError(errorResponse, mensajePorDefecto = 'Ocurrió un error inesperado') {
  if (!errorResponse) return mensajePorDefecto

  // Si es una instancia de Error (excepción JavaScript)
  if (errorResponse instanceof Error) {
    return errorResponse.message || mensajePorDefecto
  }

  // Extraer el campo 'detail' o usar el objeto directamente
  const detail = errorResponse.detail !== undefined ? errorResponse.detail : errorResponse

  // Si 'detail' es un string directo
  if (typeof detail === 'string' && detail.trim() !== '') {
    return detail
  }

  // Si 'detail' es una lista de objetos de validación de FastAPI / Pydantic [{loc, msg, type, input}]
  if (Array.isArray(detail)) {
    if (detail.length === 0) return mensajePorDefecto

    const mensajes = detail.map((err) => {
      if (typeof err === 'string') return err
      if (typeof err === 'object' && err !== null) {
        const locArray = Array.isArray(err.loc) ? err.loc.filter((item) => item !== 'body') : []
        const campo = locArray.join('.')

        if (err.type === 'missing') {
          return campo ? `El campo '${campo}' es obligatorio.` : 'Falta un campo obligatorio.'
        }

        const msg = err.msg || 'Dato inválido'
        return campo ? `El campo '${campo}': ${msg}` : msg
      }
      return String(err)
    })

    return mensajes.join(' | ')
  }

  // Si 'detail' es un objeto
  if (typeof detail === 'object' && detail !== null) {
    if (typeof detail.msg === 'string') return detail.msg
    if (typeof detail.message === 'string') return detail.message
    try {
      return JSON.stringify(detail)
    } catch {
      return mensajePorDefecto
    }
  }

  return mensajePorDefecto
}
