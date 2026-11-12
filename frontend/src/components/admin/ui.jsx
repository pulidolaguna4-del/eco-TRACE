// =========================================================
// PIEZAS DE INTERFAZ DEL PANEL DE ADMINISTRACIÓN
// =========================================================
// Insignias, botones, estados vacíos y de carga, buscador, filtros,
// avisos flotantes y los modales de rechazo y confirmación.

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

// ---------------------------------------------------------
// Clases compartidas
// ---------------------------------------------------------

export const anilloFoco =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#218739] dark:focus-visible:outline-[#2fa350]'

// Para enlaces que abren otra pestaña
export function TextoPestañaNueva() {
  return <span className="sr-only"> (se abre en otra pestaña)</span>
}

export const claseTarjeta =
  'bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/60 rounded-2xl shadow-xs'

export const claseMeta = 'text-xs text-gray-500 dark:text-[#a8b3ae]'

export const claseCampo =
  'w-full px-4 py-2.5 text-sm rounded-xl bg-white dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] focus:ring-2 focus:ring-[#218739]/20 dark:focus:ring-[#2fa350]/20 transition-all duration-150 disabled:opacity-60'

// ---------------------------------------------------------
// Insignia de estado
// ---------------------------------------------------------

const ESTILOS_INSIGNIA = {
  pendiente: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
  aprobado: 'bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/40',
  rechazado: 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/40',
  admin: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
  neutro: 'bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-[#dce4e0] border-gray-200 dark:border-gray-700/60'
}

const PUNTO_INSIGNIA = {
  pendiente: 'bg-amber-500',
  aprobado: 'bg-green-600',
  rechazado: 'bg-red-600',
  admin: 'bg-amber-500',
  neutro: 'bg-gray-400'
}

export function Insignia({ tipo = 'neutro', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${ESTILOS_INSIGNIA[tipo] || ESTILOS_INSIGNIA.neutro}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${PUNTO_INSIGNIA[tipo] || PUNTO_INSIGNIA.neutro}`} aria-hidden="true" />
      {children}
    </span>
  )
}

// ---------------------------------------------------------
// Botón de acción (con estado de carga)
// ---------------------------------------------------------

const VARIANTES_BOTON = {
  primario: 'bg-[#176b2b] hover:bg-[#218739] dark:bg-[#218739] dark:hover:bg-[#2fa350] text-white shadow-xs',
  peligro: 'bg-[#c62828] hover:bg-[#b71c1c] text-white shadow-xs',
  contornoPeligro: 'bg-white dark:bg-transparent text-[#c62828] dark:text-[#ef5350] border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30',
  secundario: 'bg-gray-100 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-700/70 text-gray-800 dark:text-[#f2f5f3]',
  admin: 'bg-amber-500 hover:bg-amber-600 text-amber-950'
}

export function BotonAccion({
  children,
  onClick,
  cargando = false,
  textoCargando = 'Guardando...',
  variante = 'secundario',
  deshabilitado = false,
  tipo = 'button',
  className = '',
  ...resto
}) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={cargando || deshabilitado}
      aria-busy={cargando || undefined}
      className={`inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-xl text-xs font-bold cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${anilloFoco} ${VARIANTES_BOTON[variante]} ${className}`}
      {...resto}
    >
      {cargando ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-hidden="true" />
          {textoCargando}
        </>
      ) : (
        children
      )}
    </button>
  )
}

// ---------------------------------------------------------
// Avatar con la inicial
// ---------------------------------------------------------

export function Avatar({ nombre, tamaño = 'md', admin = false }) {
  const inicial = nombre?.trim()?.charAt(0)?.toUpperCase() || '?'
  const clases = tamaño === 'lg' ? 'w-12 h-12 text-base' : tamaño === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  return (
    <span className={`relative shrink-0 rounded-full bg-gradient-to-br from-[#218739] to-[#4caf68] text-white flex items-center justify-center font-black ${clases}`} aria-hidden="true">
      {inicial}
      {admin && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-[#1a2320]" />
      )}
    </span>
  )
}

// ---------------------------------------------------------
// Estado vacío
// ---------------------------------------------------------

export function EstadoVacio({ icono = '🌿', titulo, descripcion, children }) {
  return (
    <div className={`${claseTarjeta} px-6 py-16 text-center`}>
      <span className="mx-auto w-16 h-16 rounded-2xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/15 dark:border-gray-800 flex items-center justify-center text-3xl" aria-hidden="true">
        {icono}
      </span>
      <h3 className="mt-5 text-lg font-black text-gray-900 dark:text-white">{titulo}</h3>
      {descripcion && <p className="mt-1.5 text-sm text-gray-500 dark:text-[#a8b3ae] max-w-sm mx-auto">{descripcion}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------
// Esqueleto de carga
// ---------------------------------------------------------

export function Esqueleto({ filas = 3, alto = 'h-28' }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className={`${claseTarjeta} ${alto} p-5 flex gap-4 animate-pulse`}>
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800/70 shrink-0" />
          <div className="flex-1 space-y-2.5 py-1">
            <div className="h-3.5 w-1/3 rounded-full bg-gray-100 dark:bg-gray-800/70" />
            <div className="h-3 w-2/3 rounded-full bg-gray-100 dark:bg-gray-800/70" />
            <div className="h-3 w-1/2 rounded-full bg-gray-100 dark:bg-gray-800/70" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------
// Buscador
// ---------------------------------------------------------

export function Buscador({ valor, onCambiar, placeholder, etiqueta }) {
  return (
    <div className="relative flex-1 min-w-[14rem]">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none" aria-hidden="true">
        🔎
      </span>
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta || placeholder}
        className={`${claseCampo} pl-10`}
      />
    </div>
  )
}

// ---------------------------------------------------------
// Filtros en chips
// ---------------------------------------------------------

export function FiltroChips({ opciones, valor, onCambiar, etiqueta }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={etiqueta}>
      {opciones.map((opcion) => {
        const activo = valor === opcion.id
        return (
          <button
            key={opcion.id}
            type="button"
            onClick={() => onCambiar(opcion.id)}
            aria-pressed={activo}
            className={`inline-flex items-center gap-1.5 min-h-9 px-3.5 rounded-full text-xs font-bold border cursor-pointer transition-colors ${anilloFoco} ${
              activo
                ? 'bg-[#176b2b] dark:bg-[#2fa350] text-white border-transparent'
                : 'bg-white dark:bg-[#121816] text-gray-700 dark:text-[#dce4e0] border-gray-200 dark:border-gray-800/60 hover:border-[#218739]/50 dark:hover:border-[#2fa350]/50'
            }`}
          >
            {opcion.icono && <span aria-hidden="true">{opcion.icono}</span>}
            {opcion.nombre}
            {opcion.total !== undefined && (
              <span className={`tabular-nums px-1.5 rounded-full text-[11px] ${activo ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-[#a8b3ae]'}`}>
                {opcion.total}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------
// Avisos flotantes (éxito y error)
// ---------------------------------------------------------

export function Avisos({ mensaje, error, onCerrarMensaje, onCerrarError }) {
  const reducido = useReducedMotion()
  const animacion = {
    initial: reducido ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reducido ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 },
    transition: { duration: 0.2 }
  }

  return (
    // La región existe siempre para que los lectores de pantalla anuncien los avisos
    <div aria-live="polite" className="fixed bottom-4 right-4 left-4 sm:left-auto z-[2100] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            {...animacion}
            role="alert"
            className="pointer-events-auto w-full sm:w-96 flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-[#1a2320] border border-red-200 dark:border-red-900/50 shadow-2xl"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center" aria-hidden="true">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">Algo salió mal</p>
              <p className="text-xs text-gray-600 dark:text-[#a8b3ae] mt-0.5 break-words">{error}</p>
            </div>
            <button type="button" onClick={onCerrarError} className={`w-9 h-9 shrink-0 rounded-lg text-gray-500 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${anilloFoco}`} aria-label="Cerrar aviso de error">
              ✕
            </button>
          </motion.div>
        )}

        {mensaje && (
          <motion.div
            key={mensaje}
            {...animacion}
            role="status"
            className="pointer-events-auto w-full sm:w-96 flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-[#1a2320] border border-green-200 dark:border-green-900/50 shadow-2xl"
          >
            <span className="w-9 h-9 shrink-0 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center" aria-hidden="true">✅</span>
            <p className="flex-1 min-w-0 text-sm font-bold text-gray-900 dark:text-white self-center">{mensaje}</p>
            <button type="button" onClick={onCerrarMensaje} className={`w-9 h-9 shrink-0 rounded-lg text-gray-500 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${anilloFoco}`} aria-label="Cerrar aviso">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------
// Base de los modales
// ---------------------------------------------------------

const SELECTOR_ENFOCABLE = 'button:not([disabled]), [href], textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function BaseModal({ idTitulo, procesando, onCancelar, children }) {
  const reducido = useReducedMotion()
  const refPanel = useRef(null)

  // Al cerrar, devolver el foco al botón que abrió el modal. Se guarda
  // durante el primer render, antes de que autoFocus mueva el foco.
  const [anterior] = useState(() => document.activeElement)
  useEffect(() => {
    return () => {
      if (anterior instanceof HTMLElement && document.contains(anterior)) anterior.focus()
    }
  }, [anterior])

  // Escape cierra; Tab no sale del modal
  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === 'Escape' && !procesando) {
        onCancelar()
        return
      }
      if (e.key !== 'Tab' || !refPanel.current) return
      const enfocables = [...refPanel.current.querySelectorAll(SELECTOR_ENFOCABLE)]
      if (enfocables.length === 0) return
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [procesando, onCancelar])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[2000] bg-[#0b1f14]/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      onClick={() => !procesando && onCancelar()}
    >
      <motion.div
        ref={refPanel}
        initial={reducido ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducido ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white dark:bg-[#1a2320] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function EncabezadoModal({ id, icono, titulo, subtitulo, onCerrar, procesando }) {
  return (
    <div className="relative px-6 pt-6 pb-5">
      <button
        type="button"
        onClick={onCerrar}
        disabled={procesando}
        className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer ${anilloFoco}`}
        aria-label="Cerrar"
      >
        ✕
      </button>
      <div className="flex items-start gap-4 pr-10">
        <span className="w-12 h-12 shrink-0 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-xl" aria-hidden="true">
          {icono}
        </span>
        <div>
          <h2 id={id} className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{titulo}</h2>
          {subtitulo && <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-1">{subtitulo}</p>}
        </div>
      </div>
    </div>
  )
}

function TarjetaElemento({ etiqueta, nombre, detalle }) {
  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-[#0f1512] border border-gray-100 dark:border-gray-800/60 p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#a8b3ae]">{etiqueta}</p>
      <p className="text-base font-extrabold text-gray-900 dark:text-white mt-1">{nombre}</p>
      {detalle && <p className="text-xs text-gray-600 dark:text-[#a8b3ae] mt-1">{detalle}</p>}
    </div>
  )
}

// ---------------------------------------------------------
// Modal de rechazo (pide el motivo)
// ---------------------------------------------------------

const MOTIVO_MIN = 5
const MOTIVO_MAX = 500

export function ModalRechazo({
  elemento,
  procesando,
  onCancelar,
  onConfirmar,
  titulo = 'Rechazar punto',
  subtitulo = 'Le enviaremos el motivo por correo a quien propuso el punto.',
  etiqueta = 'Punto seleccionado',
  textoConfirmar = 'Rechazar punto',
  placeholder = 'Ej.: la ubicación no coincide con la dirección indicada.'
}) {
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')

  const confirmar = (e) => {
    e.preventDefault()
    const limpio = motivo.trim()
    if (limpio.length < MOTIVO_MIN) {
      setErrorMotivo(`Escribe al menos ${MOTIVO_MIN} caracteres para explicar el motivo.`)
      return
    }
    onConfirmar(limpio)
  }

  return (
    <BaseModal idTitulo="titulo-modal-rechazo" procesando={procesando} onCancelar={onCancelar}>
      <EncabezadoModal id="titulo-modal-rechazo" icono="✕" titulo={titulo} subtitulo={subtitulo} onCerrar={onCancelar} procesando={procesando} />

      <form onSubmit={confirmar} className="px-6 pb-6 space-y-5">
        <TarjetaElemento etiqueta={etiqueta} nombre={elemento.nombre} detalle={elemento.direccion && `📍 ${elemento.direccion}`} />

        <div>
          <label htmlFor="motivo-rechazo" className="block text-xs font-bold text-gray-700 dark:text-[#dce4e0] mb-2">
            Motivo del rechazo
          </label>
          <textarea
            id="motivo-rechazo"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErrorMotivo('')
            }}
            maxLength={MOTIVO_MAX}
            rows={4}
            autoFocus
            required
            disabled={procesando}
            placeholder={placeholder}
            aria-invalid={Boolean(errorMotivo)}
            aria-describedby="ayuda-motivo"
            className={`${claseCampo} resize-none`}
          />
          <div className="flex justify-between items-start gap-3 mt-1.5">
            <p id="ayuda-motivo" className={`text-xs ${errorMotivo ? 'text-red-700 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-[#a8b3ae]'}`}>
              {errorMotivo || 'Explica qué debe corregir el usuario.'}
            </p>
            <p className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae] tabular-nums shrink-0" aria-hidden="true">{motivo.length}/{MOTIVO_MAX}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <BotonAccion onClick={onCancelar} deshabilitado={procesando}>Cancelar</BotonAccion>
          <BotonAccion tipo="submit" variante="peligro" cargando={procesando} textoCargando="Rechazando...">
            {textoConfirmar}
          </BotonAccion>
        </div>
      </form>
    </BaseModal>
  )
}

// ---------------------------------------------------------
// Modal de confirmación (acciones destructivas)
// ---------------------------------------------------------

export function ModalConfirmacion({ titulo, descripcion, etiqueta, nombre, detalle, textoConfirmar, procesando, onCancelar, onConfirmar }) {
  return (
    <BaseModal idTitulo="titulo-modal-confirmacion" procesando={procesando} onCancelar={onCancelar}>
      <EncabezadoModal id="titulo-modal-confirmacion" icono="🗑️" titulo={titulo} subtitulo="Esta acción no se puede deshacer." onCerrar={onCancelar} procesando={procesando} />

      <div className="px-6 pb-6 space-y-5">
        <TarjetaElemento etiqueta={etiqueta} nombre={nombre} detalle={detalle} />
        <p className="text-sm text-gray-600 dark:text-[#a8b3ae] leading-relaxed">{descripcion}</p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <BotonAccion onClick={onCancelar} deshabilitado={procesando} autoFocus>Cancelar</BotonAccion>
          <BotonAccion variante="peligro" onClick={onConfirmar} cargando={procesando} textoCargando="Eliminando...">
            {textoConfirmar}
          </BotonAccion>
        </div>
      </div>
    </BaseModal>
  )
}
