// =========================================================
// SERVICIO DEL DASHBOARD DE IMPACTO (HU-22)
// =========================================================
// Cuenta las entregas que no fueron rechazadas: las verificadas y
// las que siguen pendientes de verificación (se informan aparte).

import { prisma } from '../config/prisma.js'
import { resumenImpacto as resumenRegalos } from './regalos.service.js'
import { HttpError } from '../utils/HttpError.js'

const NO_RECHAZADA = { estado: { not: 'rechazada' } }

function redondear(valor) {
  return Math.round((valor ?? 0) * 100) / 100
}

async function buscarCategoria(nombre) {
  if (!nombre) return null

  const categoria = await prisma.categoria.findUnique({ where: { nombre } })
  if (!categoria) {
    throw new HttpError(400, `La categoría '${nombre}' no existe`)
  }
  return categoria
}

// Totales por categoría, siempre sin filtrar, para comparar entre ellas
async function porCategoria() {
  const [categorias, entregas, puntos] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { id: 'asc' } }),
    prisma.entrega.groupBy({
      by: ['categoria_id'],
      where: NO_RECHAZADA,
      _sum: { peso: true },
      _count: { _all: true }
    }),
    prisma.puntoCategoria.groupBy({
      by: ['categoria_id'],
      where: { punto: { estado: 'aprobado' } },
      _count: { _all: true }
    })
  ])

  const entregasPor = new Map(entregas.map((e) => [e.categoria_id, e]))
  const puntosPor = new Map(puntos.map((p) => [p.categoria_id, p._count._all]))

  const filas = categorias.map((categoria) => ({
    categoria: categoria.nombre,
    kg_reciclados: redondear(entregasPor.get(categoria.id)?._sum.peso),
    total_entregas: entregasPor.get(categoria.id)?._count._all ?? 0,
    puntos_activos: puntosPor.get(categoria.id) ?? 0
  }))

  // Entregas antiguas a las que no se les pudo deducir la categoría
  const sinCategoria = entregasPor.get(null)
  if (sinCategoria) {
    filas.push({
      categoria: null,
      kg_reciclados: redondear(sinCategoria._sum.peso),
      total_entregas: sinCategoria._count._all,
      puntos_activos: 0
    })
  }

  return filas
}

// Datos extra que solo ve el administrador
async function resumenAdmin() {
  const [usuariosRegistrados, usuariosActivos, puntosPendientes, entregasPendientes, reportesPendientes] =
    await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({
        where: { OR: [{ entregas: { some: {} } }, { puntos: { some: {} } }] }
      }),
      prisma.punto.count({ where: { estado: 'pendiente' } }),
      prisma.entrega.count({ where: { estado: 'pendiente' } }),
      prisma.reporte.count({ where: { estado: 'pendiente' } })
    ])

  return {
    usuarios_registrados: usuariosRegistrados,
    usuarios_activos: usuariosActivos,
    puntos_pendientes: puntosPendientes,
    entregas_pendientes: entregasPendientes,
    reportes_pendientes: reportesPendientes
  }
}

export async function obtener({ categoria: nombreCategoria, esAdmin = false }) {
  const categoria = await buscarCategoria(nombreCategoria)

  const filtroEntregas = {
    ...NO_RECHAZADA,
    ...(categoria ? { categoria_id: categoria.id } : {})
  }

  const filtroPuntos = {
    estado: 'aprobado',
    ...(categoria ? { categorias: { some: { categoria_id: categoria.id } } } : {})
  }

  const [totales, porVerificar, puntosActivos, usuariosParticipantes, categorias, admin, regalos] =
    await Promise.all([
      prisma.entrega.aggregate({
        where: filtroEntregas,
        _sum: { peso: true },
        _count: { _all: true }
      }),
      prisma.entrega.count({ where: { ...filtroEntregas, estado: 'pendiente' } }),
      prisma.punto.count({ where: filtroPuntos }),
      prisma.entrega.groupBy({ by: ['usuario_id'], where: filtroEntregas }),
      porCategoria(),
      esAdmin ? resumenAdmin() : null,
      // Regalos entregados: "kg reutilizados", separado de los reciclados
      resumenRegalos()
    ])

  return {
    categoria: categoria?.nombre ?? null,
    kg_reciclados: redondear(totales._sum.peso),
    total_entregas: totales._count._all,
    entregas_por_verificar: porVerificar,
    puntos_activos: puntosActivos,
    usuarios_participantes: usuariosParticipantes.length,
    por_categoria: categorias,
    regalos,
    ...(admin ? { admin } : {})
  }
}
