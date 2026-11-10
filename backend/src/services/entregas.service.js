// =========================================================
// SERVICIO DE ENTREGAS / DONACIONES / RECICLAJE
// =========================================================

import { prisma } from '../config/prisma.js'
import { HttpError } from '../utils/HttpError.js'

const CON_RELACIONES = { punto: true, categoria: true }

// "reciclaje" | "ropa" | "electronicos", el tipo que usaba el formulario anterior
export function tipoDeCategoria(nombreCategoria = '') {
  const nombre = nombreCategoria.toLowerCase()
  if (nombre.includes('ropa')) return 'ropa'
  if (nombre.includes('electr')) return 'electronicos'
  return 'reciclaje'
}

// La categoría de la entrega debe ser una de las que recibe el punto
function resolverCategoria(punto, { categoria, tipo }) {
  const categoriasPunto = punto.categorias.map((pc) => pc.categoria)

  if (categoria) {
    const encontrada = categoriasPunto.find((c) => c.nombre === categoria)
    if (!encontrada) {
      throw new HttpError(400, `Este punto no recibe la categoría '${categoria}'`)
    }
    return encontrada
  }

  if (tipo) {
    const porTipo = categoriasPunto.find((c) => tipoDeCategoria(c.nombre) === tipo)
    if (porTipo) return porTipo
  }

  if (categoriasPunto.length === 1) return categoriasPunto[0]
  if (categoriasPunto.length === 0) return null

  throw new HttpError(400, 'Selecciona la categoría del material que entregaste')
}

function limpiar(texto) {
  const valor = texto?.trim()
  return valor ? valor : null
}

export async function registrar(usuarioId, datos) {
  const punto = await prisma.punto.findUnique({
    where: { id: datos.punto_id },
    include: { categorias: { include: { categoria: true } } }
  })

  if (!punto) {
    throw new HttpError(404, 'Punto no encontrado')
  }
  if (punto.estado !== 'aprobado') {
    throw new HttpError(
      400,
      'No puedes registrar una entrega en un punto que no está aprobado'
    )
  }
  if (datos.cantidad <= 0) {
    throw new HttpError(400, 'La cantidad debe ser mayor que 0')
  }

  const categoria = resolverCategoria(punto, datos)
  const tipo = categoria ? tipoDeCategoria(categoria.nombre) : datos.tipo

  if (!tipo) {
    throw new HttpError(400, 'Indica el tipo de material que entregaste')
  }

  const unidad = datos.unidad.trim().toLowerCase()

  // En kilogramos el peso es la misma cantidad; en otras unidades es opcional
  const peso = unidad === 'kg' ? datos.cantidad : (datos.peso ?? null)
  if (peso !== null && peso <= 0) {
    throw new HttpError(400, 'El peso debe ser mayor que 0')
  }

  const fotoUrl = limpiar(datos.foto_url)
  if (fotoUrl && !/^https?:\/\//i.test(fotoUrl)) {
    throw new HttpError(400, 'La URL de la foto debe empezar por http:// o https://')
  }

  return prisma.entrega.create({
    data: {
      usuario_id: usuarioId,
      punto_id: datos.punto_id,
      categoria_id: categoria?.id ?? null,
      tipo,
      nombre_articulo: limpiar(datos.nombre_articulo),
      cantidad: datos.cantidad,
      unidad,
      peso,
      estado_conservacion: datos.estado_conservacion ?? null,
      foto_url: fotoUrl,
      estado: 'pendiente',
      observacion: limpiar(datos.observacion)
    },
    include: CON_RELACIONES
  })
}

export function listarDeUsuario(usuarioId) {
  return prisma.entrega.findMany({
    where: { usuario_id: usuarioId },
    include: CON_RELACIONES,
    orderBy: { fecha: 'desc' }
  })
}

export function listarTodas() {
  return prisma.entrega.findMany({
    include: { usuario: true, ...CON_RELACIONES },
    orderBy: { fecha: 'desc' }
  })
}

// ---------------------------------------------------------
// Administración: verificar o rechazar una entrega
// ---------------------------------------------------------

export async function revisar(entregaId, { estado, observacion_admin }) {
  const entrega = await prisma.entrega.findUnique({ where: { id: entregaId } })
  if (!entrega) {
    throw new HttpError(404, 'Entrega no encontrada')
  }

  const observacion = limpiar(observacion_admin)

  if (estado === 'rechazada' && (!observacion || observacion.length < 5)) {
    throw new HttpError(400, 'Explica el motivo del rechazo con al menos 5 caracteres')
  }

  return prisma.entrega.update({
    where: { id: entregaId },
    data: { estado, observacion_admin: observacion },
    include: { usuario: true, ...CON_RELACIONES }
  })
}
