// =========================================================
// ENTREGAS
// =========================================================
// El administrador verifica o rechaza (con motivo) las entregas y
// donaciones que registran los usuarios en los puntos aprobados.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { ESTADOS_CONSERVACION } from '../../utils/puntoUtils'
import { claseTarjeta, Avatar, BotonAccion, Buscador, EstadoVacio, Esqueleto, FiltroChips, Insignia, TextoPestañaNueva } from './ui'
import { coincide, formatearFecha, formatearNumero, haceCuanto, TIPOS_ENTREGA, ESTADO_A_INSIGNIA, NOMBRE_ESTADO, variantesItem } from './utilidades'

export default function SeccionEntregas({ entregas, filtro, onFiltro, busqueda, onBusqueda, entregaProcesandoId, onVerificar, onRechazar, cargando }) {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  const contar = (estado) => entregas.filter((e) => e.estado === estado).length
  const opciones = [
    { id: 'todas', nombre: 'Todas', total: entregas.length },
    { id: 'pendiente', nombre: 'Por verificar', total: contar('pendiente') },
    { id: 'verificada', nombre: 'Verificadas', total: contar('verificada') },
    { id: 'rechazada', nombre: 'Rechazadas', total: contar('rechazada') }
  ]

  const visibles = entregas
    .filter((e) => filtro === 'todas' || e.estado === filtro)
    .filter((e) => !busqueda || [e.usuario_nombre, e.usuario_correo, e.punto_nombre, e.nombre_articulo, `#${e.id}`].some((t) => coincide(t, busqueda)))
    .sort((a, b) => Number(b.estado === 'pendiente') - Number(a.estado === 'pendiente') || new Date(b.fecha) - new Date(a.fecha))

  return (
    <div className="space-y-4">
      <div className={`${claseTarjeta} p-4 flex flex-col gap-3`}>
        <Buscador valor={busqueda} onCambiar={onBusqueda} placeholder="Buscar por usuario, punto o artículo" />
        <FiltroChips opciones={opciones} valor={filtro} onCambiar={onFiltro} etiqueta="Filtrar entregas por estado" />
      </div>

      {cargando ? (
        <Esqueleto filas={4} />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono="♻️"
          titulo={entregas.length === 0 ? 'Aún no hay entregas' : filtro === 'pendiente' && !busqueda ? 'No hay entregas por verificar' : 'Ninguna entrega coincide'}
          descripcion={
            entregas.length === 0
              ? 'Cuando los usuarios registren entregas o donaciones, aparecerán aquí.'
              : filtro === 'pendiente' && !busqueda
                ? 'Revisaste todas las entregas registradas.'
                : 'Prueba con otra búsqueda o cambia el filtro.'
          }
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visibles.map((entrega) => {
              const tipo = TIPOS_ENTREGA[entrega.tipo] || TIPOS_ENTREGA.reciclaje
              const conservacion = ESTADOS_CONSERVACION.find((c) => c.id === entrega.estado_conservacion)?.nombre ?? entrega.estado_conservacion
              const procesando = entregaProcesandoId === entrega.id

              return (
                <motion.li
                  key={entrega.id}
                  layout={!reducido}
                  variants={variantes}
                  initial="oculto"
                  animate="visible"
                  exit="salida"
                  className={`${claseTarjeta} p-5`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Usuario y punto */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar nombre={entrega.usuario_nombre} />
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{entrega.usuario_nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] truncate">{entrega.usuario_correo}</p>
                        <p className="mt-2 text-xs text-gray-700 dark:text-[#dce4e0]">
                          <span aria-hidden="true">📍</span> <span className="font-bold">{entrega.punto_nombre}</span>
                          {entrega.punto_direccion && <span className="text-gray-500 dark:text-[#a8b3ae]"> · {entrega.punto_direccion}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Qué entregó */}
                    <div className="flex items-center gap-4 lg:w-64 shrink-0">
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/10 dark:border-gray-800 flex items-center justify-center text-lg" aria-hidden="true">
                        {tipo.icono}
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-tight">
                          {formatearNumero(entrega.cantidad, 2)} <span className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">{entrega.unidad}</span>
                          {entrega.peso && entrega.unidad !== 'kg' && (
                            <span className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]"> · ≈ {formatearNumero(entrega.peso, 2)} kg</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-[#a8b3ae] truncate">
                          {tipo.nombre}
                          {entrega.nombre_articulo ? ` · ${entrega.nombre_articulo}` : ''}
                          {conservacion ? ` · ${conservacion}` : ''}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#a8b3ae]" title={formatearFecha(entrega.fecha)}>
                          {haceCuanto(entrega.fecha)}
                        </p>
                      </div>
                    </div>

                    {/* Estado y acciones */}
                    <div className="flex flex-wrap items-center lg:justify-end gap-2 lg:w-64 shrink-0">
                      <Insignia tipo={ESTADO_A_INSIGNIA[entrega.estado]}>{NOMBRE_ESTADO[entrega.estado] || entrega.estado}</Insignia>
                      <div className="flex gap-2 ml-auto lg:ml-0">
                        {entrega.estado !== 'rechazada' && (
                          <BotonAccion
                            variante="contornoPeligro"
                            onClick={() => onRechazar(entrega)}
                            deshabilitado={procesando}
                            aria-label={`Rechazar la entrega de ${entrega.usuario_nombre}`}
                          >
                            Rechazar
                          </BotonAccion>
                        )}
                        {entrega.estado !== 'verificada' && (
                          <BotonAccion
                            variante="primario"
                            onClick={() => onVerificar(entrega.id)}
                            cargando={procesando}
                            aria-label={`Verificar la entrega de ${entrega.usuario_nombre}`}
                          >
                            ✓ Verificar
                          </BotonAccion>
                        )}
                      </div>
                    </div>
                  </div>

                  {(entrega.observacion || entrega.foto_url || (entrega.estado === 'rechazada' && entrega.observacion_admin)) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row sm:items-start gap-3">
                      {entrega.observacion && (
                        <p className="flex-1 text-xs text-gray-600 dark:text-[#a8b3ae]">
                          <span className="font-bold text-gray-700 dark:text-[#dce4e0]">Nota del usuario:</span> {entrega.observacion}
                        </p>
                      )}
                      {entrega.estado === 'rechazada' && entrega.observacion_admin && (
                        <p className="flex-1 text-xs text-red-800 dark:text-red-300">
                          <span className="font-bold">Motivo del rechazo:</span> {entrega.observacion_admin}
                        </p>
                      )}
                      {entrega.foto_url && (
                        <a href={entrega.foto_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#218739] dark:text-[#2fa350] hover:underline underline-offset-2 shrink-0">
                          <span aria-hidden="true">📷</span> Ver foto <span aria-hidden="true">↗</span><TextoPestañaNueva />
                        </a>
                      )}
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
