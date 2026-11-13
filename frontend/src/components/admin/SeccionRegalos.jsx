// =========================================================
// REGALOS (MARKETPLACE GRATUITO): MODERACIÓN (HU-28)
// =========================================================
// Reportes de la comunidad sobre publicaciones o mensajes del chat.
// - Del chat solo se ve el mensaje reportado y los dos anteriores y
//   posteriores, nunca la conversación completa.
// - El administrador puede ocultar (o volver a mostrar) la publicación,
//   eliminarla, y marcar el reporte como revisado o descartarlo.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { claseTarjeta, claseCampo, anilloFoco, Avatar, BotonAccion, EstadoVacio, Esqueleto, FiltroChips, Insignia, ModalConfirmacion, ModalRechazo } from './ui'
import { formatearFecha, haceCuanto, ESTADO_A_INSIGNIA, NOMBRE_ESTADO, variantesItem } from './utilidades'
import { formatearMensajeError } from '../../utils/puntoUtils'
import { FotoRegalo, InsigniaRegalo } from '../regalos/piezas'
import { formatearCantidad } from '../../utils/regalos'

function ContextoMensaje({ contexto }) {
  return (
    <ol className="mt-3 space-y-1.5" aria-label="Mensaje reportado y los cercanos">
      {contexto.map((m) =>
        m.tipo === 'sistema' ? (
          <li key={m.id} className="text-center text-[11px] text-gray-500 dark:text-[#a8b3ae]">— {m.texto} —</li>
        ) : (
          <li
            key={m.id}
            className={`rounded-xl px-3 py-2 text-sm border ${
              m.reportado
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                : 'bg-white dark:bg-[#1a2320] border-gray-100 dark:border-gray-800/60 opacity-80'
            }`}
          >
            <p className="text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae]">
              {m.remitente_nombre ?? 'Usuario'} · {formatearFecha(m.fecha)}
              {m.reportado && <span className="ml-1.5 text-red-700 dark:text-red-400">· Reportado</span>}
            </p>
            <p className="text-gray-800 dark:text-[#f2f5f3] whitespace-pre-wrap break-words">{m.texto}</p>
          </li>
        )
      )}
    </ol>
  )
}

export default function SeccionRegalos({ reportes, cargando, peticion, onRecargar, avisar, fallar }) {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  const [filtro, setFiltro] = useState('pendiente')
  const [notas, setNotas] = useState({})
  const [procesando, setProcesando] = useState(null) // `${accion}-${id}`
  const [aOcultar, setAOcultar] = useState(null) // regalo
  const [aEliminar, setAEliminar] = useState(null) // regalo

  const contar = (estado) => reportes.filter((r) => r.estado === estado).length
  const opciones = [
    { id: 'pendiente', nombre: 'Abiertos', total: contar('pendiente') },
    { id: 'revisado', nombre: 'Revisados', total: contar('revisado') },
    { id: 'descartado', nombre: 'Descartados', total: contar('descartado') },
    { id: 'todos', nombre: 'Todos', total: reportes.length }
  ]

  const visibles = reportes.filter((r) => filtro === 'todos' || r.estado === filtro)

  const ejecutar = async (clave, ruta, opciones, textoExito) => {
    setProcesando(clave)
    try {
      const { respuesta, datos } = await peticion(ruta, opciones)
      if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No se pudo completar la acción.'))
      avisar(textoExito)
      await onRecargar()
      return true
    } catch (err) {
      fallar(err.message === 'Failed to fetch' ? 'No pudimos conectar con el servidor.' : err.message)
      return false
    } finally {
      setProcesando(null)
    }
  }

  const revisar = (reporte, estado) =>
    ejecutar(
      `revisar-${reporte.id}`,
      `/admin/regalos/reportes/${reporte.id}/revisar`,
      { metodo: 'PUT', cuerpo: { estado, observacion_admin: notas[reporte.id]?.trim() || null } },
      estado === 'revisado' ? 'Marcaste el reporte como revisado.' : 'Descartaste el reporte.'
    )

  const cambiarVisibilidad = async (regalo, oculto, motivo = null) => {
    const hecho = await ejecutar(
      `ocultar-${regalo.id}`,
      `/admin/regalos/${regalo.id}/ocultar`,
      { metodo: 'PUT', cuerpo: { oculto, motivo } },
      oculto ? 'Ocultaste la publicación. Sus chats quedaron en solo lectura.' : 'La publicación vuelve a estar visible.'
    )
    if (hecho) setAOcultar(null)
  }

  const eliminar = async () => {
    const hecho = await ejecutar(`eliminar-${aEliminar.id}`, `/admin/regalos/${aEliminar.id}`, { metodo: 'DELETE' }, 'Eliminaste la publicación.')
    if (hecho) setAEliminar(null)
  }

  const ocupado = procesando !== null

  return (
    <div className="space-y-4">
      <div className={`${claseTarjeta} p-4`}>
        <FiltroChips opciones={opciones} valor={filtro} onCambiar={setFiltro} etiqueta="Filtrar reportes de regalos por estado" />
      </div>

      {cargando ? (
        <Esqueleto filas={3} alto="h-40" />
      ) : visibles.length === 0 ? (
        <EstadoVacio
          icono="🎁"
          titulo={filtro === 'pendiente' ? 'No hay reportes abiertos' : 'No hay reportes en esta lista'}
          descripcion={filtro === 'pendiente' ? 'La comunidad no ha reportado publicaciones ni mensajes de Regalos.' : 'Cambia el filtro para ver otros reportes.'}
        />
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visibles.map((r) => {
              const pendiente = r.estado === 'pendiente'
              const regalo = r.regalo
              const idCampo = `nota-reporte-regalo-${r.id}`

              return (
                <motion.li key={r.id} layout={!reducido} variants={variantes} initial="oculto" animate="visible" exit="salida" className={`${claseTarjeta} overflow-hidden`}>
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* REGALO */}
                    <div className="flex items-start gap-4">
                      <FotoRegalo ruta={regalo.fotos?.[0]} alt="" className="w-16 h-16 shrink-0 rounded-xl text-2xl" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Insignia tipo={ESTADO_A_INSIGNIA[r.estado] || 'pendiente'}>{pendiente ? 'Abierto' : NOMBRE_ESTADO[r.estado] || r.estado}</Insignia>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#a8b3ae]">
                            {r.mensaje ? '💬 Mensaje del chat' : '📢 Publicación'}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-base font-black text-gray-900 dark:text-white break-words">{regalo.titulo}</h3>
                        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>{formatearCantidad(regalo.cantidad, regalo.unidad)}</span>
                          <span>· Publicado por {regalo.usuario.nombre}</span>
                          <InsigniaRegalo estado={regalo.estado} oculto={regalo.oculto} />
                        </p>
                      </div>
                      <Link
                        to={`/regalos/${regalo.id}`}
                        className={`hidden sm:inline-flex shrink-0 items-center gap-1.5 min-h-9 px-3.5 rounded-xl text-xs font-bold text-[#176b2b] dark:text-[#2fa350] bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/20 dark:border-gray-800 hover:bg-[#218739]/10 ${anilloFoco}`}
                      >
                        Ver publicación
                      </Link>
                    </div>

                    {/* MOTIVO */}
                    <blockquote className="rounded-2xl bg-gray-50 dark:bg-[#0f1512] border border-gray-100 dark:border-gray-800/60 p-4">
                      <p className="text-sm text-gray-800 dark:text-[#f2f5f3] whitespace-pre-wrap break-words leading-relaxed">{r.motivo}</p>
                      <footer className="mt-3 flex items-center gap-2">
                        <Avatar nombre={r.reportante.nombre} tamaño="sm" />
                        <span className="text-xs text-gray-600 dark:text-[#a8b3ae] min-w-0 truncate" title={formatearFecha(r.fecha_creacion)}>
                          <span className="font-bold text-gray-800 dark:text-[#dce4e0]">{r.reportante.nombre}</span> · {haceCuanto(r.fecha_creacion)}
                        </span>
                      </footer>
                      {r.mensaje && <ContextoMensaje contexto={r.mensaje.contexto} />}
                    </blockquote>

                    {regalo.oculto && regalo.motivo_ocultamiento && (
                      <p className="text-xs text-red-800 dark:text-red-300">🙈 Oculto: {regalo.motivo_ocultamiento}</p>
                    )}

                    {!pendiente && r.observacion_admin && (
                      <p className="text-xs text-gray-600 dark:text-[#a8b3ae]"><strong>Nota:</strong> {r.observacion_admin}</p>
                    )}

                    {/* PUBLICACIÓN */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/regalos/${regalo.id}`}
                        className={`sm:hidden inline-flex items-center min-h-10 px-4 rounded-xl text-xs font-bold text-[#176b2b] dark:text-[#2fa350] bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/20 dark:border-gray-800 ${anilloFoco}`}
                      >
                        Ver publicación
                      </Link>
                      {regalo.oculto ? (
                        <BotonAccion onClick={() => cambiarVisibilidad(regalo, false)} cargando={procesando === `ocultar-${regalo.id}`} deshabilitado={ocupado}>
                          👁️ Volver a mostrar
                        </BotonAccion>
                      ) : (
                        <BotonAccion onClick={() => setAOcultar(regalo)} deshabilitado={ocupado}>
                          🙈 Ocultar publicación
                        </BotonAccion>
                      )}
                      <BotonAccion variante="contornoPeligro" onClick={() => setAEliminar(regalo)} deshabilitado={ocupado}>
                        🗑️ Eliminar
                      </BotonAccion>
                    </div>
                  </div>

                  {/* REPORTE */}
                  {pendiente && (
                    <div className="px-5 sm:px-6 py-4 bg-gray-50/60 dark:bg-[#121816]/60 border-t border-gray-100 dark:border-gray-800/60 space-y-3">
                      <div>
                        <label htmlFor={idCampo} className="block text-xs font-bold text-gray-700 dark:text-[#dce4e0] mb-1.5">
                          Nota interna <span className="font-semibold text-gray-500 dark:text-[#a8b3ae]">(opcional)</span>
                        </label>
                        <textarea
                          id={idCampo}
                          value={notas[r.id] || ''}
                          onChange={(e) => setNotas((actuales) => ({ ...actuales, [r.id]: e.target.value }))}
                          rows={2}
                          maxLength={500}
                          placeholder="Ej.: se ocultó porque ofrecía medicamentos."
                          disabled={ocupado}
                          className={`${claseCampo} resize-none`}
                        />
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <BotonAccion onClick={() => revisar(r, 'descartado')} cargando={procesando === `revisar-${r.id}`} deshabilitado={ocupado}>
                          Descartar
                        </BotonAccion>
                        <BotonAccion variante="primario" onClick={() => revisar(r, 'revisado')} cargando={procesando === `revisar-${r.id}`} deshabilitado={ocupado}>
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

      <AnimatePresence>
        {aOcultar && (
          <ModalRechazo
            key={`ocultar-${aOcultar.id}`}
            elemento={{ nombre: aOcultar.titulo, direccion: null }}
            procesando={procesando === `ocultar-${aOcultar.id}`}
            onCancelar={() => setAOcultar(null)}
            onConfirmar={(motivo) => cambiarVisibilidad(aOcultar, true, motivo)}
            titulo="Ocultar publicación"
            subtitulo="Saldrá del listado y sus chats quedarán en solo lectura. Quien la publicó verá el motivo."
            etiqueta="Regalo"
            textoConfirmar="Ocultar"
            textoCargando="Ocultando..."
            ayuda="Explica por qué se oculta la publicación."
            placeholder="Ej.: no se permite regalar medicamentos."
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aEliminar && (
          <ModalConfirmacion
            key={`eliminar-${aEliminar.id}`}
            titulo="¿Eliminar esta publicación?"
            etiqueta="Regalo"
            nombre={aEliminar.titulo}
            detalle={`Publicado por ${aEliminar.usuario.nombre}`}
            descripcion="También se eliminarán sus fotos, sus chats con todos los mensajes y sus reportes."
            textoConfirmar="Eliminar publicación"
            procesando={procesando === `eliminar-${aEliminar.id}`}
            onCancelar={() => setAEliminar(null)}
            onConfirmar={eliminar}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
