// =========================================================
// FOTOS Y ARCHIVOS SUBIDOS
// =========================================================

import { API_URL } from '../../config'

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp']
export const FOTO_MAX_BYTES = 5 * 1024 * 1024

const LADO_MAXIMO = 1600
const CALIDAD = 0.85

// La API guarda rutas relativas (/uploads/...). Las entregas antiguas
// pueden tener una URL completa.
export function urlArchivo(ruta) {
  if (!ruta) return null
  return /^https?:\/\//i.test(ruta) ? ruta : `${API_URL}${ruta}`
}

export function formatearTamaño(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`
}

// Reduce la foto a LADO_MAXIMO px y la vuelve JPEG antes de subirla.
// Así pesa mucho menos y se pierden los metadatos EXIF (que pueden
// incluir la ubicación GPS de donde se tomó), por eso se usa siempre
// la versión nueva. Solo si el navegador no puede procesarla se envía
// el archivo original.
export async function comprimirFoto(archivo) {
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
    const ancho = Math.round(imagen.width * escala)
    const alto = Math.round(imagen.height * escala)

    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    ctx.fillStyle = '#ffffff' // fondo para PNG/WEBP con transparencia
    ctx.fillRect(0, 0, ancho, alto)
    ctx.drawImage(imagen, 0, 0, ancho, alto)
    imagen.close?.()

    const blob = await new Promise((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD))
    if (!blob) return archivo

    const nombre = archivo.name.replace(/\.[^.]+$/, '') || 'foto'
    return new File([blob], `${nombre}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return archivo
  }
}
