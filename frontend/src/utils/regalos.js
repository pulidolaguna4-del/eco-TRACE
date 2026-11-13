// =========================================================
// REGALOS (MARKETPLACE GRATUITO): CONSTANTES Y APOYO
// =========================================================
// Especificación: docs/requisitos/Especificacion_Regalos.md

import { API_URL } from '../../config'
import { formatearMensajeError } from './puntoUtils'

// Las mismas categorías y unidades que valida el backend
export const CATEGORIAS_REGALO = [
  { id: 'madera', nombre: 'Madera', icono: '🪵' },
  { id: 'papel_carton', nombre: 'Papel y cartón', icono: '📦' },
  { id: 'plastico', nombre: 'Plástico', icono: '🧴' },
  { id: 'vidrio', nombre: 'Vidrio', icono: '🫙' },
  { id: 'metal', nombre: 'Metal', icono: '🔩' },
  { id: 'ropa', nombre: 'Ropa', icono: '👕' },
  { id: 'electronicos', nombre: 'Electrónicos', icono: '🔌' },
  { id: 'muebles', nombre: 'Muebles', icono: '🪑' },
  { id: 'otro', nombre: 'Otro', icono: '🎁' }
]

export function categoriaRegalo(id) {
  return CATEGORIAS_REGALO.find((c) => c.id === id) ?? CATEGORIAS_REGALO[CATEGORIAS_REGALO.length - 1]
}

export const UNIDADES_REGALO = [
  { id: 'kg', nombre: 'kg' },
  { id: 'unidades', nombre: 'unidades' }
]

// tipo: estilo de la <Insignia> del panel (components/admin/ui.jsx)
export const ESTADOS_REGALO = {
  disponible: { nombre: 'Disponible', tipo: 'aprobado' },
  reservado: { nombre: 'Reservado', tipo: 'pendiente' },
  entregado: { nombre: 'Entregado', tipo: 'neutro' },
  cancelado: { nombre: 'Cancelado', tipo: 'rechazado' },
  vencido: { nombre: 'Vencido', tipo: 'neutro' }
}

export const OBJETOS_PROHIBIDOS = [
  'Comida o bebidas abiertas',
  'Medicamentos',
  'Animales',
  'Armas',
  'Químicos o productos peligrosos',
  'Objetos robados o cualquier cosa ilegal'
]

export const CONSEJOS_SEGURIDAD = [
  'Encuéntrense en un lugar público y de día.',
  'eco-TRACE es gratis: nunca compartas datos bancarios ni pagues por un regalo.',
  'Comparte la dirección exacta solo cuando ya hayan acordado la entrega.'
]

export const LIMITES_REGALO = {
  fotos: 3,
  titulo: 80,
  descripcion: 500,
  barrio: 80,
  mensaje: 1000,
  motivo: 500
}

// "5 kg" · "1 unidad" · "3 unidades"
export function formatearCantidad(cantidad, unidad) {
  const valor = Number(cantidad || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })
  if (unidad === 'kg') return `${valor} kg`
  return `${valor} ${Number(cantidad) === 1 ? 'unidad' : 'unidades'}`
}

// ---------------------------------------------------------
// Sesión
// ---------------------------------------------------------

export function leerSesion() {
  try {
    const token = localStorage.getItem('access_token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
    return token && usuario ? { token, usuario } : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------
// Peticiones a la API
// ---------------------------------------------------------

// Devuelve los datos o lanza un Error con un mensaje para mostrar.
// `cuerpo` puede ser un objeto (JSON) o un FormData.
export async function api(ruta, { metodo = 'GET', cuerpo, señal } = {}) {
  const token = localStorage.getItem('access_token')
  const esFormulario = typeof FormData !== 'undefined' && cuerpo instanceof FormData

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cuerpo !== undefined && !esFormulario ? { 'Content-Type': 'application/json' } : {})
      },
      ...(cuerpo !== undefined ? { body: esFormulario ? cuerpo : JSON.stringify(cuerpo) } : {}),
      signal: señal
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('No pudimos conectar con el servidor.')
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const error = new Error(
      respuesta.status === 401
        ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
        : formatearMensajeError(datos?.detail, 'Ocurrió un error inesperado.')
    )
    error.status = respuesta.status
    throw error
  }

  return datos
}
