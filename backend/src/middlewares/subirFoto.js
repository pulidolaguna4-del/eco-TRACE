// =========================================================
// SUBIDA DE FOTOS (MULTER)
// =========================================================
// Recibe una foto en el campo `foto` de un formulario multipart y la
// guarda en disco con un nombre aleatorio. En la base de datos solo se
// guarda la ruta pública (ver rutaPublicaFoto).
//
// Validaciones:
// - Solo JPG, PNG o WEBP, máximo 5 MB y un solo archivo.
// - El tipo que declara el navegador se puede falsificar, así que
//   después de guardar se revisan los primeros bytes del archivo.
// - El nombre original no se usa: evita rutas o extensiones peligrosas.
//
// Si la petición falla más adelante, el manejador de errores borra el
// archivo (ver borrarArchivoSubido).

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import multer from 'multer'

import { config } from '../config/env.js'
import { HttpError } from '../utils/HttpError.js'

const CARPETA = 'entregas'
const destino = path.join(config.archivos.directorio, CARPETA)

fs.mkdirSync(destino, { recursive: true })

const EXTENSIONES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
}

// Firmas de los formatos permitidos (primeros bytes del archivo)
function esImagenValida(cabecera) {
  const jpg = cabecera[0] === 0xff && cabecera[1] === 0xd8 && cabecera[2] === 0xff
  const png = cabecera.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const webp = cabecera.toString('ascii', 0, 4) === 'RIFF' && cabecera.toString('ascii', 8, 12) === 'WEBP'
  return jpg || png || webp
}

const subida = multer({
  storage: multer.diskStorage({
    destination: destino,
    filename: (_req, archivo, cb) => cb(null, `${randomUUID()}${EXTENSIONES[archivo.mimetype]}`)
  }),
  limits: { fileSize: config.archivos.fotoMaxBytes, files: 1 },
  fileFilter: (_req, archivo, cb) => {
    if (EXTENSIONES[archivo.mimetype]) cb(null, true)
    else cb(new HttpError(400, 'La foto debe ser una imagen JPG, PNG o WEBP'))
  }
})

export function subirFoto(req, res, next) {
  subida.single('foto')(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      const mensaje =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'La foto no puede pesar más de 5 MB'
          : error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT'
            ? 'Adjunta una sola foto en el campo "foto"'
            : 'No se pudo recibir la foto'
      return next(new HttpError(400, mensaje))
    }
    if (error) return next(error)
    if (!req.file) return next()

    try {
      const manejador = await fs.promises.open(req.file.path, 'r')
      const cabecera = Buffer.alloc(12)
      await manejador.read(cabecera, 0, 12, 0)
      await manejador.close()

      if (!esImagenValida(cabecera)) {
        await borrarArchivoSubido(req)
        return next(new HttpError(400, 'El archivo no es una imagen JPG, PNG o WEBP válida'))
      }
      next()
    } catch (err) {
      next(err)
    }
  })
}

// Ruta que se guarda en la base de datos
export function rutaPublicaFoto(archivo) {
  return `${config.archivos.rutaPublica}/${CARPETA}/${archivo.filename}`
}

export async function borrarArchivoSubido(req) {
  if (!req.file?.path) return
  await fs.promises.unlink(req.file.path).catch(() => {})
  req.file = undefined
}
