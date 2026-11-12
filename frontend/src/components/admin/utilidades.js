// Funciones de apoyo del panel de administración

export function formatearFecha(fecha, conHora = true) {
  if (!fecha) return 'Fecha no disponible'
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return 'Fecha no disponible'
  return d.toLocaleString('es-CO', conHora ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
}

// Hace cuánto (ej. "hace 3 h"); para fechas antiguas devuelve la fecha
export function haceCuanto(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  const seg = Math.round((Date.now() - d.getTime()) / 1000)
  if (Number.isNaN(seg)) return ''
  if (seg < 60) return 'hace un momento'
  const min = Math.round(seg / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const dias = Math.round(h / 24)
  if (dias < 7) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  return formatearFecha(fecha, false)
}

// Kg que aporta una entrega al impacto: en kg es la cantidad, en otras
// unidades solo cuenta si se indicó el peso.
export function kgDeEntrega(entrega) {
  const peso = Number(entrega.peso)
  if (Number.isFinite(peso) && peso > 0) return peso
  if (entrega.unidad === 'kg') return Number(entrega.cantidad) || 0
  return 0
}

export function formatearNumero(valor, decimales = 0) {
  return Number(valor || 0).toLocaleString('es-CO', { maximumFractionDigits: decimales })
}

// Enlace para revisar la ubicación en OpenStreetMap
export function enlaceMapa(latitud, longitud) {
  const lat = Number(latitud)
  const lon = Number(longitud)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
}

export function coincide(texto, busqueda) {
  if (!busqueda) return true
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .includes(
      busqueda
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
    )
}

export const TIPOS_ENTREGA = {
  ropa: { nombre: 'Ropa', icono: '👕' },
  electronicos: { nombre: 'Electrónicos', icono: '🔌' },
  reciclaje: { nombre: 'Reciclaje', icono: '♻️' }
}

export const ESTADO_A_INSIGNIA = {
  aprobado: 'aprobado',
  verificada: 'aprobado',
  revisado: 'aprobado',
  rechazado: 'rechazado',
  rechazada: 'rechazado',
  descartado: 'rechazado',
  pendiente: 'pendiente'
}

export const NOMBRE_ESTADO = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente',
  verificada: 'Verificada',
  rechazada: 'Rechazada',
  revisado: 'Revisado',
  descartado: 'Descartado'
}

// Animación de los elementos de las listas
export function variantesItem(reducido) {
  return {
    oculto: { opacity: 0, y: reducido ? 0 : 12 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
    salida: { opacity: 0, x: reducido ? 0 : -24, transition: { duration: 0.2 } }
  }
}
