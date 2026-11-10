// =========================================================
// SERIALIZADORES DE RESPUESTA
// =========================================================
// Mantienen exactamente la forma de las respuestas del backend
// anterior (response_model de FastAPI) para no romper el frontend.

// Las columnas son "timestamp without time zone" y Prisma siempre guarda
// en ellas la hora UTC. Se devuelven en ISO 8601 con "Z" para que el
// navegador las convierta a la hora local (Bogotá, UTC-5) al mostrarlas.
// FastAPI las devolvía sin zona y el frontend mostraba la hora UTC.
export function fecha(valor) {
  if (!valor) return valor
  return valor.toISOString()
}

export function usuario(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    es_admin: u.es_admin
  }
}

// Incluir con: include: { categorias: { include: { categoria: true } } }
export function punto(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    direccion: p.direccion,
    localidad: p.localidad,
    categorias: (p.categorias ?? []).map((pc) => pc.categoria.nombre),
    latitud: p.latitud,
    longitud: p.longitud,
    estado: p.estado,
    fecha_creacion: fecha(p.fecha_creacion),
    foto_url: p.foto_url ?? null,
    motivo_rechazo: p.motivo_rechazo ?? null,
    usuario_id: p.usuario_id,
    calificacion_promedio: p.calificacion_promedio ?? 0,
    total_resenas: p.total_resenas ?? 0,
    revision_prioritaria: p.revision_prioritaria ?? false,
    motivo_revision: p.motivo_revision ?? null,
    fecha_revision: fecha(p.fecha_revision) ?? null
  }
}

// Incluir con: include: { usuario: { select: { nombre: true } } }
export function resena(r) {
  return {
    id: r.id,
    punto_id: r.punto_id,
    usuario_id: r.usuario_id,
    nombre_usuario: r.usuario?.nombre ?? 'Usuario eliminado',
    puntuacion: r.puntuacion,
    comentario: r.comentario ?? null,
    fecha: fecha(r.fecha),
    fecha_actualizacion: fecha(r.fecha_actualizacion)
  }
}

// Resumen de calificación de un punto
export function calificacion(p) {
  return {
    punto_id: p.id,
    calificacion_promedio: p.calificacion_promedio ?? 0,
    total_resenas: p.total_resenas ?? 0
  }
}

// Incluir con: include: { punto: true, categoria: true }
export function entrega(e) {
  return {
    id: e.id,
    usuario_id: e.usuario_id,
    punto_id: e.punto_id,
    punto_nombre: e.punto?.nombre ?? null,
    punto_direccion: e.punto?.direccion ?? null,
    categoria_id: e.categoria_id ?? null,
    categoria: e.categoria?.nombre ?? null,
    tipo: e.tipo,
    nombre_articulo: e.nombre_articulo ?? null,
    cantidad: e.cantidad,
    unidad: e.unidad,
    peso: e.peso ?? null,
    estado_conservacion: e.estado_conservacion ?? null,
    foto_url: e.foto_url ?? null,
    fecha: fecha(e.fecha),
    estado: e.estado,
    observacion: e.observacion ?? null,
    observacion_admin: e.observacion_admin ?? null
  }
}

// Incluir con: include: { usuario: true, punto: true, categoria: true }
export function entregaAdmin(e) {
  return {
    ...entrega(e),
    usuario_nombre: e.usuario?.nombre ?? 'Usuario no encontrado',
    usuario_correo: e.usuario?.correo ?? '',
    punto_nombre: e.punto?.nombre ?? 'Punto no encontrado',
    punto_direccion: e.punto?.direccion ?? ''
  }
}

// Incluir con: include: { usuario: true, punto: true }
export function reporteAdmin(r) {
  return {
    id: r.id,
    punto_id: r.punto_id,
    nombre_punto: r.punto?.nombre ?? 'Punto eliminado',
    direccion_punto: r.punto?.direccion ?? null,
    usuario_id: r.usuario_id,
    nombre_usuario: r.usuario?.nombre ?? 'Usuario eliminado',
    correo_usuario: r.usuario?.correo ?? null,
    motivo: r.motivo,
    estado: r.estado,
    fecha_creacion: fecha(r.fecha_creacion),
    observacion_admin: r.observacion_admin ?? null
  }
}
