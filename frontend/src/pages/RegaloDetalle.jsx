// =========================================================
// REGALOS: DETALLE (HU-25, HU-26, HU-27 y HU-28)
// =========================================================
// - Cualquiera ve las fotos, los datos y la zona aproximada.
// - Interesado: "Me interesa" abre (o crea) el chat con quien regala.
// - Dueño: ve a los interesados y gestiona el estado: reservar para
//   alguien, marcar como entregado, liberar, cancelar, renovar y editar.
// - Se actualiza solo cuando cambia el estado o llega un interesado.

import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { anilloFoco, Avatar, Avisos, BotonAccion, claseTarjeta, EstadoVacio } from '../components/admin/ui'
import { formatearFecha, haceCuanto } from '../components/admin/utilidades'
import { MapaZonas } from '../components/regalos/mapa'
import { ModalAccion, ModalEditarRegalo, ModalReporte } from '../components/regalos/modales'
import {
  ChipCategoria,
  claseBotonPrincipal,
  claseFondo,
  FotoRegalo,
  InsigniaRegalo
} from '../components/regalos/piezas'
import { useEventoChat } from '../context/ChatContext'
import { api, formatearCantidad, leerSesion } from '../utils/regalos'

// ---------------------------------------------------------
// Galería
// ---------------------------------------------------------

function Galeria({ fotos, titulo }) {
  const [actual, setActual] = useState(0)
  const lista = fotos.length ? fotos : [null]

  return (
    <div className="space-y-3">
      <div className={`${claseTarjeta} overflow-hidden aspect-[4/3]`}>
        <FotoRegalo ruta={lista[actual]} alt={`${titulo}, foto ${actual + 1} de ${lista.length}`} className="w-full h-full" />
      </div>
      {lista.length > 1 && (
        <div className="flex gap-3" role="group" aria-label="Fotos">
          {lista.map((ruta, i) => (
            <button
              key={ruta ?? i}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver la foto ${i + 1}`}
              aria-pressed={actual === i}
              className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-colors ${anilloFoco} ${
                actual === i ? 'border-[#218739] dark:border-[#2fa350]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <FotoRegalo ruta={ruta} alt="" className="w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div className="py-3 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800/60 last:border-0">
      <dt className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">{etiqueta}</dt>
      <dd className="text-sm font-bold text-gray-900 dark:text-white text-right">{children}</dd>
    </div>
  )
}

function Aviso({ tono = 'info', icono, children }) {
  const tonos = {
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200',
    exito: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40 text-green-900 dark:text-green-200',
    alerta: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200',
    peligro: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200'
  }
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 text-sm ${tonos[tono]}`}>
      <span aria-hidden="true">{icono}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------
// Panel del dueño: interesados y estados
// ---------------------------------------------------------

function Interesado({ interesado, reservadoParaId, puedeReservar, procesando, onReservar }) {
  const esReservado = interesado.usuario.id === reservadoParaId
  const ultimo = interesado.ultimo_mensaje

  return (
    <li className="py-3 flex items-center gap-3">
      <Avatar nombre={interesado.usuario.nombre} tamaño="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate flex items-center gap-2">
          {interesado.usuario.nombre}
          {esReservado && <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">· Reservado</span>}
        </p>
        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] truncate">
          {ultimo ? (ultimo.tipo === 'sistema' ? ultimo.texto : `“${ultimo.texto}”`) : 'Sin mensajes'} · {haceCuanto(interesado.fecha_ultimo_mensaje)}
        </p>
      </div>
      <Link
        to={`/mensajes?c=${interesado.conversacion_id}`}
        className={`relative inline-flex items-center gap-1 min-h-9 px-3 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800/70 text-gray-800 dark:text-[#f2f5f3] hover:bg-gray-200 dark:hover:bg-gray-700/70 ${anilloFoco}`}
      >
        💬 Chat
        {interesado.no_leidos > 0 && (
          <span className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
            {interesado.no_leidos}
            <span className="sr-only"> sin leer</span>
          </span>
        )}
      </Link>
      {puedeReservar && (
        <BotonAccion variante="primario" cargando={procesando} textoCargando="…" onClick={() => onReservar(interesado)}>
          Reservar
        </BotonAccion>
      )}
    </li>
  )
}

// ---------------------------------------------------------
// Página
// ---------------------------------------------------------

function RegaloDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const reducido = useReducedMotion()
  const sesion = leerSesion()

  const [regalo, setRegalo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [mensaje, setMensaje] = useState(location.state?.aviso ?? '')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null) // nombre de la acción en curso
  const [modal, setModal] = useState(null) // { tipo, interesado? }

  const cargar = useCallback(async () => {
    try {
      setRegalo(await api(`/regalos/${id}`))
      setErrorCarga('')
    } catch (err) {
      setErrorCarga(err.status === 404 ? 'Este regalo no existe o ya no está publicado.' : err.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    setCargando(true)
    cargar()
  }, [cargar])

  // Limpiar el aviso que llega al publicar (para que no se repita al volver)
  useEffect(() => {
    if (location.state?.aviso) navigate(location.pathname, { replace: true, state: null })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(''), 4500)
    return () => clearTimeout(t)
  }, [mensaje])

  // En vivo: cambios de estado y nuevos interesados o mensajes
  useEventoChat('regalo:estado', (datos) => {
    if (datos.regalo_id === Number(id)) cargar()
  })
  useEventoChat('mensaje:nuevo', (datos) => {
    if (!regalo?.es_mio) return
    const conocida = regalo.interesados?.some((i) => i.conversacion_id === datos.conversacion_id)
    if (conocida || datos.conversacion_nueva) cargar()
  })

  // ---------------------------------------------------------
  // Acciones
  // ---------------------------------------------------------

  const ejecutar = async (accion, peticion, textoExito) => {
    setProcesando(accion)
    setError('')
    try {
      const resultado = await peticion()
      setModal(null)
      if (textoExito) setMensaje(textoExito)
      return resultado
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setProcesando(null)
    }
  }

  const meInteresa = async () => {
    const resultado = await ejecutar('interes', () => api(`/regalos/${id}/conversacion`, { metodo: 'POST' }))
    if (resultado) navigate(`/mensajes?c=${resultado.conversacion_id}`)
  }

  const cambiarEstado = async (accion, cuerpo, textoExito) => {
    const actualizado = await ejecutar(accion, () => api(`/regalos/${id}/${accion}`, { metodo: 'PUT', cuerpo }), textoExito)
    if (actualizado) await cargar()
  }

  const guardarEdicion = async (datos) => {
    const actualizado = await ejecutar('editar', () => api(`/regalos/${id}`, { metodo: 'PUT', cuerpo: datos }), 'Guardamos los cambios.')
    if (actualizado) await cargar()
  }

  const reportar = (motivo) =>
    ejecutar('reportar', () => api(`/regalos/${id}/reportes`, { metodo: 'POST', cuerpo: { motivo } }), 'Gracias. Un administrador revisará tu reporte.')

  // ---------------------------------------------------------
  // Estados de carga
  // ---------------------------------------------------------

  if (cargando) {
    return (
      <div className={claseFondo}>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid lg:grid-cols-2 gap-8" aria-busy="true">
          <div className="aspect-[4/3] rounded-2xl bg-gray-200/70 dark:bg-gray-800/50 animate-pulse" />
          <div className="space-y-4">
            <div className="h-10 w-2/3 rounded-xl bg-gray-200/70 dark:bg-gray-800/50 animate-pulse" />
            <div className="h-48 rounded-2xl bg-gray-200/70 dark:bg-gray-800/50 animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className={`${claseFondo} flex items-center justify-center p-4`}>
        <EstadoVacio icono="🎁" titulo="No encontramos este regalo" descripcion={errorCarga}>
          <Link to="/regalos" className={claseBotonPrincipal}>Ver otros regalos</Link>
        </EstadoVacio>
      </div>
    )
  }

  const esMio = regalo.es_mio
  const abierto = ['disponible', 'reservado'].includes(regalo.estado)
  const interesados = regalo.interesados ?? []
  const reservadoParaId = regalo.reservado_para?.id ?? null

  // ---------------------------------------------------------
  // Bloque de acciones
  // ---------------------------------------------------------

  let acciones

  if (esMio) {
    acciones = (
      <div className="space-y-4">
        {regalo.oculto && (
          <Aviso tono="peligro" icono="🙈">
            <strong>Un administrador ocultó esta publicación.</strong>
            {regalo.motivo_ocultamiento && <> Motivo: {regalo.motivo_ocultamiento}</>}
          </Aviso>
        )}

        {regalo.estado === 'disponible' && (
          <Aviso tono="exito" icono="🟢">
            <strong>Está publicado.</strong> Vence el {formatearFecha(regalo.fecha_vencimiento, false)}. Cuando decidas a quién dárselo, resérvalo para esa persona.
          </Aviso>
        )}

        {regalo.estado === 'reservado' && (
          <Aviso tono="alerta" icono="🤝">
            <strong>Reservado para {regalo.reservado_para?.nombre}.</strong> Cuando lo recoja, márcalo como entregado. Si no llega, libéralo para que otros lo pidan.
          </Aviso>
        )}

        {regalo.estado === 'entregado' && (
          <Aviso tono="exito" icono="✅">
            <strong>Entregado{regalo.reservado_para ? ` a ${regalo.reservado_para.nombre}` : ''}</strong>
            {regalo.fecha_entrega && <> el {formatearFecha(regalo.fecha_entrega, false)}</>}. ¡Gracias por darle una segunda vida!
          </Aviso>
        )}

        {regalo.estado === 'vencido' && (
          <Aviso tono="alerta" icono="⏰">
            <strong>Esta publicación venció.</strong> Renuévala para que vuelva a aparecer durante 30 días más.
          </Aviso>
        )}

        {regalo.estado === 'cancelado' && (
          <Aviso tono="info" icono="🛑">Cancelaste este regalo. Los chats quedaron en solo lectura.</Aviso>
        )}

        <div className="flex flex-wrap gap-2">
          {regalo.estado === 'reservado' && (
            <>
              <BotonAccion variante="primario" onClick={() => setModal({ tipo: 'entregar' })}>✅ Marcar como entregado</BotonAccion>
              <BotonAccion onClick={() => setModal({ tipo: 'liberar' })}>🔄 Liberar</BotonAccion>
            </>
          )}
          {['disponible', 'vencido'].includes(regalo.estado) && (
            <BotonAccion variante={regalo.estado === 'vencido' ? 'primario' : 'secundario'} cargando={procesando === 'renovar'} textoCargando="Renovando…" onClick={() => cambiarEstado('renovar', undefined, 'Renovaste la publicación por 30 días.')}>
              ⏰ Renovar 30 días
            </BotonAccion>
          )}
          {['disponible', 'reservado', 'vencido'].includes(regalo.estado) && (
            <>
              <BotonAccion onClick={() => setModal({ tipo: 'editar' })}>✏️ Editar</BotonAccion>
              <BotonAccion variante="contornoPeligro" onClick={() => setModal({ tipo: 'cancelar' })}>Ya no lo regalo</BotonAccion>
            </>
          )}
        </div>

        {/* INTERESADOS */}
        <section aria-labelledby="titulo-interesados" className="pt-2">
          <h2 id="titulo-interesados" className="text-sm font-black text-gray-900 dark:text-white">
            Interesados <span className="text-gray-500 dark:text-[#a8b3ae] font-bold">({interesados.length})</span>
          </h2>
          {interesados.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-[#a8b3ae]">
              Aún nadie lo ha pedido. Cuando alguien pulse "Me interesa", aparecerá aquí y te avisaremos en Mensajes.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {interesados.map((i) => (
                <Interesado
                  key={i.conversacion_id}
                  interesado={i}
                  reservadoParaId={reservadoParaId}
                  puedeReservar={regalo.estado === 'disponible' && !regalo.oculto}
                  procesando={procesando === `reservar-${i.usuario.id}`}
                  onReservar={(interesado) => setModal({ tipo: 'reservar', interesado })}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    )
  } else if (!sesion) {
    acciones = (
      <div className="space-y-3">
        <Link to="/login" className={`${claseBotonPrincipal} w-full`}>Inicia sesión para pedirlo</Link>
        <p className="text-xs text-center text-gray-500 dark:text-[#a8b3ae]">Necesitas una cuenta para escribirle a quien lo regala.</p>
      </div>
    )
  } else {
    acciones = (
      <div className="space-y-3">
        {regalo.reservado_para_mi && regalo.estado === 'reservado' && (
          <Aviso tono="exito" icono="🎉"><strong>¡Lo reservaron para ti!</strong> Acuerden por el chat cuándo y dónde recogerlo.</Aviso>
        )}
        {regalo.reservado_para_mi && regalo.estado === 'entregado' && (
          <Aviso tono="exito" icono="✅"><strong>Recibiste este regalo.</strong> ¡Que lo disfrutes!</Aviso>
        )}
        {!regalo.reservado_para_mi && regalo.estado === 'reservado' && (
          <Aviso tono="alerta" icono="🤝">Está reservado para otra persona. Si vuelve a estar disponible, aparecerá en el listado.</Aviso>
        )}
        {!abierto && !regalo.reservado_para_mi && (
          <Aviso tono="info" icono="ℹ️">Este regalo ya no está disponible.</Aviso>
        )}

        {regalo.mi_conversacion_id ? (
          <Link to={`/mensajes?c=${regalo.mi_conversacion_id}`} className={`${claseBotonPrincipal} w-full`}>💬 Abrir el chat</Link>
        ) : regalo.estado === 'disponible' ? (
          <button type="button" onClick={meInteresa} disabled={procesando === 'interes'} className={`${claseBotonPrincipal} w-full disabled:opacity-60`}>
            {procesando === 'interes' ? 'Abriendo el chat…' : '🙋 Me interesa'}
          </button>
        ) : null}

        {regalo.estado === 'disponible' && !regalo.mi_conversacion_id && (
          <p className="text-xs text-center text-gray-500 dark:text-[#a8b3ae]">
            Se abrirá un chat con {regalo.usuario.nombre}. Quien regala elige a quién se lo entrega.
          </p>
        )}

        <button
          type="button"
          onClick={() => setModal({ tipo: 'reportar' })}
          className={`w-full text-xs font-bold text-gray-500 dark:text-[#a8b3ae] hover:text-red-700 dark:hover:text-red-400 py-2 rounded-lg cursor-pointer ${anilloFoco}`}
        >
          🚩 Reportar esta publicación
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  const puntoExacto = regalo.ubicacion_exacta ? [regalo.ubicacion_exacta.latitud, regalo.ubicacion_exacta.longitud] : null

  return (
    <div className={claseFondo}>
      <motion.main
        initial={reducido ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6"
      >
        <Link to={esMio ? '/mis-regalos' : '/regalos'} className={`inline-flex text-sm font-bold text-gray-600 dark:text-[#a8b3ae] hover:text-[#218739] dark:hover:text-[#2fa350] rounded-lg ${anilloFoco}`}>
          ← {esMio ? 'Mis regalos' : 'Volver a Regalos'}
        </Link>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-start">
          {/* IZQUIERDA: FOTOS Y ZONA */}
          <div className="space-y-6">
            <Galeria fotos={regalo.fotos} titulo={regalo.titulo} />

            <section className={`${claseTarjeta} p-5 space-y-3`} aria-labelledby="titulo-zona">
              <div className="flex items-center justify-between gap-3">
                <h2 id="titulo-zona" className="text-sm font-black text-gray-900 dark:text-white">📍 {regalo.barrio || 'Ciudad Bolívar'}</h2>
                <span className="text-xs text-gray-500 dark:text-[#a8b3ae]">Zona aproximada · 300 m</span>
              </div>
              <MapaZonas
                regalos={[regalo]}
                centro={[regalo.zona.latitud, regalo.zona.longitud]}
                zoom={15}
                puntoExacto={puntoExacto}
                conPopup={false}
                className="h-64"
              />
              <p className="text-xs text-gray-500 dark:text-[#a8b3ae]">
                {puntoExacto
                  ? '🟠 El punto naranja es la ubicación exacta: solo tú la ves. Los demás ven el círculo.'
                  : 'La dirección exacta se acuerda por el chat, nunca se publica.'}
              </p>
            </section>
          </div>

          {/* DERECHA: DATOS Y ACCIONES */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <section className={`${claseTarjeta} p-6`}>
              <div className="flex flex-wrap items-center gap-2">
                <ChipCategoria categoria={regalo.categoria} className="!bg-[#f1f8f4] dark:!bg-[#0f1512]" />
                <InsigniaRegalo estado={regalo.estado} oculto={regalo.oculto} />
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white break-words">{regalo.titulo}</h1>
              <p className="mt-2 text-lg font-extrabold text-[#176b2b] dark:text-[#2fa350]">
                {formatearCantidad(regalo.cantidad, regalo.unidad)} <span className="text-gray-500 dark:text-[#a8b3ae] font-bold text-sm">· Gratis</span>
              </p>

              {regalo.descripcion && (
                <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-[#dce4e0] whitespace-pre-line break-words">{regalo.descripcion}</p>
              )}

              <dl className="mt-5">
                <Dato etiqueta="Lo regala">
                  <span className="inline-flex items-center gap-2">
                    <Avatar nombre={regalo.usuario.nombre} tamaño="sm" />
                    {esMio ? 'Tú' : regalo.usuario.nombre}
                  </span>
                </Dato>
                <Dato etiqueta="Publicado">{haceCuanto(regalo.fecha_creacion)}</Dato>
                <Dato etiqueta="Interesados">{regalo.total_interesados}</Dato>
              </dl>
            </section>

            <section className={`${claseTarjeta} p-6`} aria-label="Acciones">{acciones}</section>

            {!esMio && (
              <p className="text-xs text-gray-500 dark:text-[#a8b3ae] px-1">
                🛡️ Encuéntrense en un lugar público y de día. Los regalos son gratis: nunca pagues ni compartas datos bancarios.
              </p>
            )}
          </div>
        </div>
      </motion.main>

      {/* MODALES */}
      <AnimatePresence>
        {modal?.tipo === 'reservar' && (
          <ModalAccion
            icono="🤝"
            titulo={`Reservar para ${modal.interesado.usuario.nombre}`}
            descripcion="Saldrá del listado y los demás interesados recibirán un aviso en su chat."
            textoConfirmar="Reservar"
            textoCargando="Reservando…"
            procesando={procesando === `reservar-${modal.interesado.usuario.id}`}
            onCancelar={() => setModal(null)}
            onConfirmar={async () => {
              const actualizado = await ejecutar(
                `reservar-${modal.interesado.usuario.id}`,
                () => api(`/regalos/${id}/reservar`, { metodo: 'PUT', cuerpo: { interesado_id: modal.interesado.usuario.id } }),
                `Reservaste el regalo para ${modal.interesado.usuario.nombre}.`
              )
              if (actualizado) await cargar()
            }}
          />
        )}

        {modal?.tipo === 'entregar' && (
          <ModalAccion
            icono="✅"
            titulo="¿Ya lo entregaste?"
            descripcion={`Confirma que ${regalo.reservado_para?.nombre ?? 'la persona'} recogió el regalo. Los chats quedarán en solo lectura.`}
            textoConfirmar="Sí, lo entregué"
            textoCargando="Guardando…"
            procesando={procesando === 'entregar'}
            onCancelar={() => setModal(null)}
            onConfirmar={() => cambiarEstado('entregar', undefined, '¡Gracias! Marcaste el regalo como entregado.')}
          >
            {regalo.unidad === 'kg' && (
              <p className="text-sm text-gray-600 dark:text-[#a8b3ae]">
                ♻️ Sumará {formatearCantidad(regalo.cantidad, 'kg')} a los kg reutilizados de la comunidad.
              </p>
            )}
          </ModalAccion>
        )}

        {modal?.tipo === 'liberar' && (
          <ModalAccion
            icono="🔄"
            titulo="Liberar el regalo"
            descripcion="Volverá a estar disponible para todos y se avisará en los chats."
            textoConfirmar="Liberar"
            textoCargando="Liberando…"
            procesando={procesando === 'liberar'}
            onCancelar={() => setModal(null)}
            onConfirmar={() => cambiarEstado('liberar', undefined, 'El regalo volvió a estar disponible.')}
          />
        )}

        {modal?.tipo === 'cancelar' && (
          <ModalAccion
            icono="🛑"
            variante="peligro"
            titulo="¿Ya no lo regalas?"
            descripcion="La publicación se cerrará, los interesados recibirán un aviso y los chats quedarán en solo lectura. No se puede deshacer."
            textoConfirmar="Cancelar el regalo"
            textoCargando="Cancelando…"
            procesando={procesando === 'cancelar'}
            onCancelar={() => setModal(null)}
            onConfirmar={() => cambiarEstado('cancelar', undefined, 'Cancelaste el regalo.')}
          />
        )}

        {modal?.tipo === 'editar' && (
          <ModalEditarRegalo regalo={regalo} procesando={procesando === 'editar'} onCancelar={() => setModal(null)} onGuardar={guardarEdicion} />
        )}

        {modal?.tipo === 'reportar' && (
          <ModalReporte
            titulo="Reportar publicación"
            etiqueta="Regalo"
            nombre={regalo.titulo}
            detalle={`Publicado por ${regalo.usuario.nombre}`}
            procesando={procesando === 'reportar'}
            onCancelar={() => setModal(null)}
            onConfirmar={reportar}
          />
        )}
      </AnimatePresence>

      <Avisos mensaje={mensaje} error={error} onCerrarMensaje={() => setMensaje('')} onCerrarError={() => setError('')} />
    </div>
  )
}

export default RegaloDetalle
