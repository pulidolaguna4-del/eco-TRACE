// =========================================================
// TODOS LOS PUNTOS
// =========================================================
// Buscador y filtro por estado. Los puntos en revisión prioritaria
// (muchas reseñas negativas recientes) aparecen primero y resaltados.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { CategoriasBadges } from '../CategoriasBadges'
import { obtenerIconoYColorPorCategorias } from '../../utils/puntoUtils'
import { claseTarjeta, BotonAccion, Buscador, EstadoVacio, Esqueleto, FiltroChips, Insignia, TextoPestañaNueva } from './ui'
import { coincide, enlaceMapa, formatearNumero, NOMBRE_ESTADO, ESTADO_A_INSIGNIA, variantesItem } from './utilidades'

export default function SeccionPuntos({
  todosLosPuntos,
  obtenerCreador,
  filtro,
  onFiltro,
  busqueda,
  onBusqueda,
  puntoEliminandoId,
  puntoRevisandoId,
  onEliminar,
  onMarcarRevisado,
  cargando
}) {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  const contar = (fn) => todosLosPuntos.filter(fn).length
  const opciones = [
    { id: 'todos', nombre: 'Todos', total: todosLosPuntos.length },
    { id: 'aprobado', nombre: 'Aprobados', total: contar((p) => p.estado === 'aprobado') },
    { id: 'pendiente', nombre: 'Pendientes', total: contar((p) => p.estado === 'pendiente') },
    { id: 'rechazado', nombre: 'Rechazados', total: contar((p) => p.estado === 'rechazado') },
    { id: 'prioritaria', nombre: 'Revisión prioritaria', icono: '⚠️', total: contar((p) => p.revision_prioritaria) }
  ]

  const visibles = todosLosPuntos
    .filter((p) => (filtro === 'todos' ? true : filtro === 'prioritaria' ? p.revision_prioritaria : p.estado === filtro))
    .filter((p) => {
      if (!busqueda) return true
      const creador = obtenerCreador(p.usuario_id)
      return [p.nombre, p.direccion, p.localidad, creador?.nombre, creador?.correo, `#${p.id}`].some((t) => coincide(t, busqueda))
    })
    .sort((a, b) => Number(Boolean(b.revision_prioritaria)) - Number(Boolean(a.revision_prioritaria)))

  return (
    <div className="space-y-4">
      <div className={`${claseTarjeta} p-4 flex flex-col gap-3`}>
        <Buscador valor={busqueda} onCambiar={onBusqueda} placeholder="Buscar por nombre, dirección o autor" />
        <FiltroChips opciones={opciones} valor={filtro} onCambiar={onFiltro} etiqueta="Filtrar puntos por estado" />
      </div>

      {cargando ? (
        <Esqueleto filas={4} />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono="📍"
          titulo={todosLosPuntos.length === 0 ? 'Aún no hay puntos' : 'Ningún punto coincide'}
          descripcion={todosLosPuntos.length === 0 ? 'Los puntos que proponga la comunidad aparecerán aquí.' : 'Prueba con otra búsqueda o cambia el filtro.'}
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visibles.map((punto) => {
              const creador = obtenerCreador(punto.usuario_id)
              const { emoji, color } = obtenerIconoYColorPorCategorias(punto.categorias)
              const eliminando = puntoEliminandoId === punto.id
              const enlace = enlaceMapa(punto.latitud, punto.longitud)

              return (
                <motion.li
                  key={punto.id}
                  layout={!reducido}
                  variants={variantes}
                  initial="oculto"
                  animate="visible"
                  exit="salida"
                  className={`${claseTarjeta} p-5 ${punto.revision_prioritaria ? 'ring-2 ring-amber-400/70 dark:ring-amber-500/50' : ''}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Identidad */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span
                        className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${color}1a` }}
                        aria-hidden="true"
                      >
                        {emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-gray-900 dark:text-white">{punto.nombre}</h3>
                          <Insignia tipo={ESTADO_A_INSIGNIA[punto.estado] || 'pendiente'}>{NOMBRE_ESTADO[punto.estado] || punto.estado}</Insignia>
                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-[#a8b3ae]">
                          {punto.direccion}
                          {punto.localidad ? ` · ${punto.localidad}` : ''}
                          {enlace && (
                            <>
                              {' · '}
                              <a href={enlace} target="_blank" rel="noreferrer" className="font-bold text-[#218739] dark:text-[#2fa350] hover:underline underline-offset-2">
                                Ver en el mapa <span aria-hidden="true">↗</span><TextoPestañaNueva />
                              </a>
                            </>
                          )}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                          <CategoriasBadges categorias={punto.categorias} />
                          <span className="text-xs text-gray-600 dark:text-[#a8b3ae]">
                            {punto.total_resenas > 0 ? (
                              <>
                                <span className="text-amber-500" aria-hidden="true">★</span>{' '}
                                <strong className="text-gray-900 dark:text-white">{formatearNumero(punto.calificacion_promedio, 1)}</strong>
                                {' · '}
                                {punto.total_resenas} {punto.total_resenas === 1 ? 'reseña' : 'reseñas'}
                              </>
                            ) : (
                              'Sin reseñas'
                            )}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-[#a8b3ae]">
                            Por <span className="font-bold text-gray-700 dark:text-[#dce4e0]">{creador?.nombre || `Usuario #${punto.usuario_id}`}</span>
                          </span>
                        </div>

                        {punto.motivo_rechazo && punto.estado === 'rechazado' && (
                          <p className="mt-3 text-xs text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2">
                            <span className="font-bold">Motivo del rechazo:</span> {punto.motivo_rechazo}
                          </p>
                        )}

                        {punto.revision_prioritaria && (
                          <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 px-3 py-2.5">
                            <p className="text-xs font-extrabold text-amber-900 dark:text-amber-300">⚠️ Revisión prioritaria</p>
                            <p className="text-xs text-amber-800 dark:text-amber-200/90 mt-0.5">
                              {punto.motivo_revision || 'Recibió varias reseñas negativas recientes. Verifica que la información siga siendo correcta.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap lg:flex-col lg:items-stretch gap-2 lg:w-44 shrink-0">
                      {punto.revision_prioritaria && (
                        <BotonAccion
                          variante="primario"
                          onClick={() => onMarcarRevisado(punto.id)}
                          cargando={puntoRevisandoId === punto.id}
                          aria-label={`Marcar como revisado el punto ${punto.nombre}`}
                        >
                          ✓ Marcar revisado
                        </BotonAccion>
                      )}
                      <BotonAccion
                        variante="contornoPeligro"
                        onClick={() => onEliminar(punto)}
                        cargando={eliminando}
                        textoCargando="Eliminando..."
                        deshabilitado={puntoEliminandoId !== null && !eliminando}
                        aria-label={`Eliminar el punto ${punto.nombre}`}
                      >
                        🗑️ Eliminar
                      </BotonAccion>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
