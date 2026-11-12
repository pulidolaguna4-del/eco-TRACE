// =========================================================
// ARCHIVOS SUBIDOS
// =========================================================

import fs from 'node:fs'
import path from 'node:path'

import { config } from '../config/env.js'

// Borra del disco las fotos guardadas por la API (p. ej. al eliminar
// entregas). Ignora las URL externas de entregas antiguas.
export async function borrarFotos(rutas) {
  const prefijo = `${config.archivos.rutaPublica}/`

  await Promise.all(
    rutas
      .filter((ruta) => typeof ruta === 'string' && ruta.startsWith(prefijo))
      .map((ruta) => {
        const absoluta = path.resolve(config.archivos.directorio, ruta.slice(prefijo.length))
        // Nunca salir de la carpeta de archivos
        if (!absoluta.startsWith(config.archivos.directorio + path.sep)) return null
        return fs.promises.unlink(absoluta).catch(() => {})
      })
  )
}
