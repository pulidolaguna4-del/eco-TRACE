// =========================================================
// CONTROLADOR DE PUNTOS ECOLÓGICOS
// =========================================================

import * as puntosService from '../services/puntos.service.js'
import * as resenasService from '../services/resenas.service.js'
import * as serializar from '../utils/serializers.js'

export async function registrar(req, res) {
  const punto = await puntosService.registrar(req.usuario.id, req.body)
  res.json(serializar.punto(punto))
}

export async function listarAprobados(_req, res) {
  const puntos = await puntosService.listarAprobados()
  res.json(puntos.map(serializar.punto))
}

export async function listarMisPuntos(req, res) {
  const puntos = await puntosService.listarDeUsuario(req.usuario.id)
  res.json(puntos.map(serializar.punto))
}

// ---------- Reseñas ----------

export async function listarResenas(req, res) {
  const { punto, resenas, distribucion, miResena } = await resenasService.listar(
    req.params.punto_id,
    req.usuario?.id ?? null
  )

  res.json({
    ...serializar.calificacion(punto),
    distribucion,
    resenas: resenas.map(serializar.resena),
    mi_resena: miResena ? serializar.resena(miResena) : null
  })
}

export async function guardarResena(req, res) {
  const { resena, punto, creada } = await resenasService.guardar(
    req.usuario.id,
    req.params.punto_id,
    req.body
  )

  res.status(creada ? 201 : 200).json({
    mensaje: creada ? 'Reseña publicada' : 'Reseña actualizada',
    resena: serializar.resena(resena),
    ...serializar.calificacion(punto)
  })
}

export async function eliminarResena(req, res) {
  const punto = await resenasService.eliminar(req.usuario.id, req.params.punto_id)

  res.json({
    mensaje: 'Reseña eliminada',
    ...serializar.calificacion(punto)
  })
}
