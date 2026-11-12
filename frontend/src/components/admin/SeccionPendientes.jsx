// =========================================================
// PUNTOS POR APROBAR
// =========================================================
// Cada propuesta es una tarjeta con lo necesario para decidir:
// categorías, descripción, ubicación (con enlace al mapa) y autor.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { CategoriasBadges } from '../CategoriasBadges'
import { claseTarjeta, Avatar, BotonAccion, EstadoVacio, Esqueleto, Insignia, TextoPestañaNueva } from './ui'
import { enlaceMapa, haceCuanto, variantesItem } from './utilidades'

export default function SeccionPendientes({ puntosPendientes, obtenerCreador, procesandoId, onAprobar, onRechazar, cargando }) {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  if (cargando) return <Esqueleto filas={3} alto="h-48" />

  if (puntosPendientes.length === 0) {
    return (
      <EstadoVacio
        icono="🎉"
        titulo="No hay propuestas por revisar"
        descripcion="Cuando alguien proponga un punto nuevo, aparecerá aquí para que lo apruebes o lo rechaces."
      />
    )
  }

  return (
    <ul className="grid xl:grid-cols-2 gap-4">
      <AnimatePresence initial={false}>
        {puntosPendientes.map((punto) => {
          const creador = obtenerCreador(punto.usuario_id)
          const enlace = enlaceMapa(punto.latitud, punto.longitud)
          const procesando = procesandoId === punto.id
          const fecha = punto.fecha_creacion || punto.created_at

          return (
            <motion.li
              key={punto.id}
              layout={!reducido}
              variants={variantes}
              initial="oculto"
              animate="visible"
              exit="salida"
              className={`${claseTarjeta} flex flex-col overflow-hidden`}
            >
              <div className="p-5 sm:p-6 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <CategoriasBadges categorias={punto.categorias} />
                  <Insignia tipo="pendiente">Pendiente</Insignia>
                </div>

                <h3 className="mt-4 text-lg font-black tracking-tight text-gray-900 dark:text-white">{punto.nombre}</h3>

                {punto.descripcion && (
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-[#a8b3ae] leading-relaxed line-clamp-3" title={punto.descripcion}>
                    {punto.descripcion}
                  </p>
                )}

                <dl className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 dark:bg-[#0f1512] border border-gray-100 dark:border-gray-800/60 p-3">
                    <dt className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#a8b3ae]">Ubicación</dt>
                    <dd className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{punto.direccion || 'Sin dirección'}</dd>
                    <dd className="text-xs text-gray-500 dark:text-[#a8b3ae]">{punto.localidad}</dd>
                    {enlace && (
                      <dd className="mt-1.5">
                        <a href={enlace} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#218739] dark:text-[#2fa350] hover:underline underline-offset-2">
                          Ver en el mapa <span aria-hidden="true">↗</span><TextoPestañaNueva />
                        </a>
                      </dd>
                    )}
                  </div>

                  <div className="rounded-xl bg-gray-50 dark:bg-[#0f1512] border border-gray-100 dark:border-gray-800/60 p-3">
                    <dt className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#a8b3ae]">Propuesto por</dt>
                    <dd className="mt-1.5 flex items-center gap-2.5 min-w-0">
                      <Avatar nombre={creador?.nombre} tamaño="sm" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white truncate">
                          {creador?.nombre || `Usuario #${punto.usuario_id}`}
                        </span>
                        {creador?.correo && <span className="block text-xs text-gray-500 dark:text-[#a8b3ae] truncate">{creador.correo}</span>}
                      </span>
                    </dd>
                    {fecha && <dd className="mt-1.5 text-xs text-gray-500 dark:text-[#a8b3ae]">{haceCuanto(fecha)}</dd>}
                  </div>
                </dl>
              </div>

              <div className="px-5 sm:px-6 py-4 bg-gray-50/60 dark:bg-[#121816]/60 border-t border-gray-100 dark:border-gray-800/60 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <BotonAccion
                  variante="contornoPeligro"
                  onClick={() => onRechazar(punto)}
                  deshabilitado={procesandoId !== null}
                  aria-label={`Rechazar el punto ${punto.nombre}`}
                >
                  ✕ Rechazar
                </BotonAccion>
                <BotonAccion
                  variante="primario"
                  onClick={() => onAprobar(punto.id)}
                  cargando={procesando}
                  textoCargando="Aprobando..."
                  deshabilitado={procesandoId !== null && !procesando}
                  aria-label={`Aprobar el punto ${punto.nombre}`}
                >
                  ✓ Aprobar y publicar
                </BotonAccion>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
