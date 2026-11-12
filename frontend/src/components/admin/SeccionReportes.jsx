// =========================================================
// REPORTES
// =========================================================
// Avisos de la comunidad sobre información incorrecta de un punto.
// El administrador los marca como revisados o los descarta, con una
// observación opcional.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { claseTarjeta, claseCampo, Avatar, BotonAccion, EstadoVacio, Esqueleto, FiltroChips, Insignia } from './ui'
import { formatearFecha, haceCuanto, ESTADO_A_INSIGNIA, NOMBRE_ESTADO, variantesItem } from './utilidades'

function datosReporte(reporte) {
  return {
    id: reporte.id ?? reporte.reporte_id,
    estado: reporte.estado || 'pendiente',
    punto: reporte.punto_nombre || reporte.nombre_punto || reporte.punto?.nombre || `Punto #${reporte.punto_id ?? '—'}`,
    autor:
      reporte.nombre_usuario || reporte.usuario_nombre || reporte.reportante_nombre || reporte.reportante?.nombre || reporte.usuario?.nombre || `Usuario #${reporte.usuario_id ?? '—'}`,
    correo: reporte.correo_usuario || reporte.usuario_correo || reporte.reportante_correo || reporte.reportante?.correo || reporte.usuario?.correo || '',
    motivo: reporte.motivo || 'Sin motivo indicado',
    fecha: reporte.fecha_creacion || reporte.fecha || reporte.created_at
  }
}

export default function SeccionReportes({ reportes, filtro, onFiltro, observaciones, onObservacion, reporteProcesandoId, onRevisar, cargando }) {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  const contar = (estado) => reportes.filter((r) => (r.estado || 'pendiente') === estado).length
  const opciones = [
    { id: 'pendiente', nombre: 'Abiertos', total: contar('pendiente') },
    { id: 'revisado', nombre: 'Revisados', total: contar('revisado') },
    { id: 'descartado', nombre: 'Descartados', total: contar('descartado') },
    { id: 'todos', nombre: 'Todos', total: reportes.length }
  ]

  const visibles = reportes
    .map((r) => ({ original: r, ...datosReporte(r) }))
    .filter((r) => filtro === 'todos' || r.estado === filtro)
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))

  return (
    <div className="space-y-4">
      <div className={`${claseTarjeta} p-4`}>
        <FiltroChips opciones={opciones} valor={filtro} onCambiar={onFiltro} etiqueta="Filtrar reportes por estado" />
      </div>

      {cargando ? (
        <Esqueleto filas={3} alto="h-40" />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono="🚩"
          titulo={filtro === 'pendiente' ? 'No hay reportes abiertos' : 'No hay reportes en esta lista'}
          descripcion={filtro === 'pendiente' ? 'La comunidad no ha reportado información incorrecta pendiente de revisar.' : 'Cambia el filtro para ver otros reportes.'}
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visibles.map((r) => {
              const pendiente = r.estado === 'pendiente'
              const procesando = reporteProcesandoId === r.id
              const idCampo = `observacion-reporte-${r.id}`

              return (
                <motion.li
                  key={r.id}
                  layout={!reducido}
                  variants={variantes}
                  initial="oculto"
                  animate="visible"
                  exit="salida"
                  className={`${claseTarjeta} overflow-hidden`}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-11 h-11 shrink-0 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-lg" aria-hidden="true">
                          🚩
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-gray-900 dark:text-white">{r.punto}</h3>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#a8b3ae]" title={formatearFecha(r.fecha)}>
                            {r.fecha ? haceCuanto(r.fecha) : 'Fecha no disponible'}
                          </p>
                        </div>
                      </div>
                      <Insignia tipo={ESTADO_A_INSIGNIA[r.estado] || 'pendiente'}>{pendiente ? 'Abierto' : NOMBRE_ESTADO[r.estado] || r.estado}</Insignia>
                    </div>

                    <blockquote className="mt-4 rounded-2xl bg-gray-50 dark:bg-[#0f1512] border border-gray-100 dark:border-gray-800/60 p-4">
                      <p className="text-sm text-gray-800 dark:text-[#f2f5f3] whitespace-pre-wrap break-words leading-relaxed">{r.motivo}</p>
                      <footer className="mt-3 flex items-center gap-2">
                        <Avatar nombre={r.autor} tamaño="sm" />
                        <span className="text-xs text-gray-600 dark:text-[#a8b3ae] min-w-0 truncate">
                          <span className="font-bold text-gray-800 dark:text-[#dce4e0]">{r.autor}</span>
                          {r.correo ? ` · ${r.correo}` : ''}
                        </span>
                      </footer>
                    </blockquote>

                    {r.original.observacion_admin && !pendiente && (
                      <p className="mt-3 text-xs text-gray-600 dark:text-[#a8b3ae]">
                        <span className="font-bold text-gray-800 dark:text-[#dce4e0]">Tu observación:</span> {r.original.observacion_admin}
                      </p>
                    )}
                  </div>

                  {pendiente && (
                    <div className="px-5 sm:px-6 py-4 bg-gray-50/60 dark:bg-[#121816]/60 border-t border-gray-100 dark:border-gray-800/60 space-y-3">
                      <div>
                        <label htmlFor={idCampo} className="block text-xs font-bold text-gray-700 dark:text-[#dce4e0] mb-1.5">
                          Observación <span className="font-semibold text-gray-500 dark:text-[#a8b3ae]">(opcional)</span>
                        </label>
                        <textarea
                          id={idCampo}
                          value={observaciones[r.id] || ''}
                          onChange={(e) => onObservacion(r.id, e.target.value)}
                          rows={2}
                          maxLength={1000}
                          placeholder="Ej.: se corrigió el horario del punto."
                          disabled={procesando}
                          className={`${claseCampo} resize-none`}
                        />
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <BotonAccion
                          variante="secundario"
                          onClick={() => onRevisar(r.id, 'descartado')}
                          cargando={procesando}
                          deshabilitado={r.id == null || (reporteProcesandoId !== null && !procesando)}
                        >
                          Descartar
                        </BotonAccion>
                        <BotonAccion
                          variante="primario"
                          onClick={() => onRevisar(r.id, 'revisado')}
                          cargando={procesando}
                          deshabilitado={r.id == null || (reporteProcesandoId !== null && !procesando)}
                        >
                          ✓ Marcar como revisado
                        </BotonAccion>
                      </div>
                    </div>
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
