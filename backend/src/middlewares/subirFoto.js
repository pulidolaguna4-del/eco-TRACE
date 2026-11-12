// =========================================================
// SUBIDA DE FOTOS (MULTER)
// =========================================================
// Recibe fotos de un formulario multipart y las guarda en disco con un
// nombre aleatorio. En la base de datos solo se guarda la ruta pública
// (ver rutaPublicaFoto).
//
// - subirFoto:         una foto en el campo `foto`   (entregas)
// - subirFotosRegalo:  hasta 3 en el campo `fotos`   (regalos)
//
// Validaciones:
// - Solo JPG, PNG o WEBP y máximo 5 MB por foto.
// - El tipo que declara el navegador se puede falsificar, así que
//   después de guardar se revisan los primeros bytes de cada archivo.
// - El nombre original no se usa: evita rutas o extensiones peligrosas.
//
// Si la petición falla más adelante, el manejador de errores borra los
// archivos (ver borrarArchivoSubido).

import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import multer from 'multer'

import { config } from '../config/env.js'
import { HttpError } from '../utils/HttpError.js'

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

async function leerCabecera(ruta) {
  const manejador = await fs.promises.open(ruta, 'r')
  try {
    const cabecera = Buffer.alloc(12)
    await manejador.read(cabecera, 0, 12, 0)
    return cabecera
  } finally {
    await manejador.close()
  }
}

function archivosDe(req) {
  if (req.file) return [req.file]
  if (Array.isArray(req.files)) return req.files
  return []
}

function crearSubida({ carpeta, campo, maximo }) {
  const destino = path.join(config.archivos.directorio, carpeta)
  fs.mkdirSync(destino, { recursive: true })

  const subida = multer({
    storage: multer.diskStorage({
      destination: destino,
      filename: (_req, archivo, cb) => cb(null, `${randomUUID()}${EXTENSIONES[archivo.mimetype]}`)
    }),
    limits: { fileSize: config.archivos.fotoMaxBytes, files: maximo },
    fileFilter: (_req, archivo, cb) => {
      if (EXTENSIONES[archivo.mimetype]) cb(null, true)
      else cb(new HttpError(400, 'La foto debe ser una imagen JPG, PNG o WEBP'))
    }
  })

  const recibir = maximo === 1 ? subida.single(campo) : subida.array(campo, maximo)

  return (req, res, next) => {
    recibir(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        const mensaje =
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Cada foto puede pesar máximo 5 MB'
            : error.code === 'LIMIT_UNEXPECTED_FILE' || error.code === 'LIMIT_FILE_COUNT'
              ? maximo === 1
                ? `Adjunta una sola foto en el campo "${campo}"`
                : `Puedes adjuntar hasta ${maximo} fotos en el campo "${campo}"`
              : 'No se pudo recibir la foto'
        return next(new HttpError(400, mensaje))
      }
      if (error) return next(error)

      try {
        for (const archivo of archivosDe(req)) {
          if (!esImagenValida(await leerCabecera(archivo.path))) {
            await borrarArchivoSubido(req)
            return next(new HttpError(400, 'El archivo no es una imagen JPG, PNG o WEBP válida'))
          }
        }
        next()
      } catch (err) {
        next(err)
      }
    })
  }
}

export const subirFoto = crearSubida({ carpeta: 'entregas', campo: 'foto', maximo: 1 })
export const subirFotosRegalo = crearSubida({ carpeta: 'regalos', campo: 'fotos', maximo: 3 })

// Ruta que se guarda en la base de datos: /uploads/<carpeta>/<archivo>
export function rutaPublicaFoto(archivo) {
  const relativa = path.relative(config.archivos.directorio, archivo.path).split(path.sep).join('/')
  return `${config.archivos.rutaPublica}/${relativa}`
}

export async function borrarArchivoSubido(req) {
  const archivos = archivosDe(req)
  await Promise.all(archivos.map((a) => fs.promises.unlink(a.path).catch(() => {})))
  req.file = undefined
  req.files = undefined
}
