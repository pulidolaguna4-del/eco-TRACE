// =========================================================
// PIEZAS DE LA SECCIÓN REGALOS
// =========================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'

import { anilloFoco, claseTarjeta, Insignia } from '../admin/ui'
import { haceCuanto } from '../admin/utilidades'
import { urlArchivo } from '../../utils/archivos'
import { categoriaRegalo, ESTADOS_REGALO, formatearCantidad } from '../../utils/regalos'

export function InsigniaRegalo({ estado, oculto = false }) {
  if (oculto) return <Insignia tipo="rechazado">Oculto</Insignia>
  const info = ESTADOS_REGALO[estado] ?? ESTADOS_REGALO.disponible
  return <Insignia tipo={info.tipo}>{info.nombre}</Insignia>
}

export function ChipCategoria({ categoria, className = '' }) {
  const info = categoriaRegalo(categoria)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-[#0f1512]/90 text-gray-800 dark:text-[#dce4e0] border border-gray-100 dark:border-gray-800 ${className}`}>
      <span aria-hidden="true">{info.icono}</span>
      {info.nombre}
    </span>
  )
}

// Foto con respaldo si no carga
export function FotoRegalo({ ruta, alt, className = '' }) {
  const [rota, setRota] = useState(false)
  const url = urlArchivo(ruta)

  if (!url || rota) {
    return (
      <div className={`flex items-center justify-center bg-[#f1f8f4] dark:bg-[#0f1512] text-4xl ${className}`} aria-hidden="true">
        🎁
      </div>
    )
  }

  return <img src={url} alt={alt} loading="lazy" onError={() => setRota(true)} className={`object-cover ${className}`} />
}

// Tarjeta del listado. `conEstado` muestra el estado y los interesados (Mis regalos).
export function TarjetaRegalo({ regalo, conEstado = false }) {
  return (
    <Link
      to={`/regalos/${regalo.id}`}
      className={`group w-full ${claseTarjeta} overflow-hidden flex flex-col hover:border-[#218739]/40 dark:hover:border-[#2fa350]/40 hover:shadow-md transition-all ${anilloFoco}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <FotoRegalo
          ruta={regalo.fotos?.[0]}
          alt=""
          className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
        />
        <ChipCategoria categoria={regalo.categoria} className="absolute top-3 left-3 shadow-xs" />
        {conEstado ? (
          <span className="absolute top-3 right-3">
            <InsigniaRegalo estado={regalo.estado} oculto={regalo.oculto} />
          </span>
        ) : regalo.es_mio && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[11px] font-extrabold shadow-xs">
            Tuyo
          </span>
        )}
        {regalo.fotos?.length > 1 && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-bold">
            📷 {regalo.fotos.length}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">{regalo.titulo}</h3>
        <p className="text-sm font-bold text-[#176b2b] dark:text-[#2fa350]">
          {formatearCantidad(regalo.cantidad, regalo.unidad)}
          <span className="font-semibold text-gray-500 dark:text-[#a8b3ae]"> · Gratis</span>
        </p>
        <p className="mt-auto pt-2 text-xs text-gray-500 dark:text-[#a8b3ae] flex items-center justify-between gap-2">
          <span className="truncate">📍 {regalo.barrio || 'Ciudad Bolívar'}</span>
          <span className="shrink-0">{haceCuanto(regalo.fecha_creacion)}</span>
        </p>
        {conEstado && (
          <p className="text-xs font-bold text-gray-600 dark:text-[#dce4e0]">
            🙋 {regalo.total_interesados} {regalo.total_interesados === 1 ? 'interesado' : 'interesados'}
          </p>
        )}
      </div>
    </Link>
  )
}

// Encabezado de página con la etiqueta verde de arriba
export function EncabezadoPagina({ etiqueta, titulo, descripcion, children }) {
  return (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">{etiqueta}</p>
        <h1 className="mt-1.5 text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">{titulo}</h1>
        {descripcion && <p className="mt-2 text-sm text-gray-500 dark:text-[#a8b3ae] max-w-2xl">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </header>
  )
}

export const claseFondo =
  'min-h-[calc(100vh-4rem)] bg-[#f1f8f4] dark:bg-[#0f1512] text-gray-800 dark:text-[#f2f5f3]'

export const claseBotonPrincipal =
  `inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-xl text-sm font-bold text-white bg-[#176b2b] hover:bg-[#218739] dark:bg-[#218739] dark:hover:bg-[#2fa350] shadow-xs transition-colors cursor-pointer ${anilloFoco}`

export const claseBotonSecundario =
  `inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm font-bold text-gray-800 dark:text-[#f2f5f3] bg-white dark:bg-[#1a2320] border border-gray-200 dark:border-gray-800/60 hover:border-[#218739]/40 dark:hover:border-[#2fa350]/40 transition-colors cursor-pointer ${anilloFoco}`
