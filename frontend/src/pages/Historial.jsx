import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import {
  ESTADOS_CONSERVACION,
  ESTADOS_ENTREGA,
  tipoDeCategoria
} from '../utils/puntoUtils'
import { urlArchivo } from '../utils/archivos'

// =========================================================
// UTILIDADES
// =========================================================

const TIPOS = {
  reciclaje: { nombre: 'Reciclaje', icono: '♻️' },
  ropa: { nombre: 'Donación de ropa', icono: '👕' },
  electronicos: { nombre: 'Residuos electrónicos', icono: '💻' }
}

function tipoEntrega(entrega) {
  const tipo = entrega.categoria ? tipoDeCategoria(entrega.categoria) : entrega.tipo
  return TIPOS[tipo] ?? TIPOS.reciclaje
}

function nombreConservacion(id) {
  return ESTADOS_CONSERVACION.find((e) => e.id === id)?.nombre ?? null
}

function formatearFecha(fecha, conHora = false) {
  return new Date(fecha).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {})
  })
}

function formatearKg(valor) {
  return `${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg`
}

const FILTROS = [
  { id: 'todas', nombre: 'Todas' },
  { id: 'pendiente', nombre: 'Pendientes' },
  { id: 'verificada', nombre: 'Verificadas' },
  { id: 'rechazada', nombre: 'Rechazadas' }
]

// =========================================================
// COMPONENTES
// =========================================================

function BadgeEstado({ estado }) {
  const info = ESTADOS_ENTREGA[estado] ?? ESTADOS_ENTREGA.pendiente

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${info.clases}`}>
      <span>{info.icono}</span>
      <span>{info.nombre}</span>
    </span>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-[#121816] border border-gray-100 dark:border-gray-800/40 px-4 py-3">
      <dt className="text-[11px] uppercase tracking-wide font-bold text-gray-400 dark:text-[#a8b3ae]">
        {etiqueta}
      </dt>
      <dd className="text-sm font-semibold text-gray-800 dark:text-[#f2f5f3] mt-0.5 break-words">
        {children}
      </dd>
    </div>
  )
}

function DetalleEntrega({ entrega, onCerrar }) {
  const tipo = tipoEntrega(entrega)
  const conservacion = nombreConservacion(entrega.estado_conservacion)
  const [fotoRota, setFotoRota] = useState(false)
  const foto = urlArchivo(entrega.foto_url)

  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [onCerrar])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-detalle-entrega"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a2320] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
              {tipo.icono}
            </div>
            <div>
              <h2
                id="titulo-detalle-entrega"
                className="text-lg font-extrabold text-gray-900 dark:text-white"
              >
                {entrega.nombre_articulo || tipo.nombre}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Entrega #{entrega.id} · {formatearFecha(entrega.fecha, true)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <BadgeEstado estado={entrega.estado} />
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {entrega.estado === 'rechazada' && entrega.observacion_admin && (
            <p className="text-xs text-[#d93025] dark:text-[#ef5350] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3">
              <strong>Motivo del rechazo:</strong> {entrega.observacion_admin}
            </p>
          )}

          {entrega.estado === 'verificada' && entrega.observacion_admin && (
            <p className="text-xs text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-xl px-4 py-3">
              <strong>Nota del administrador:</strong> {entrega.observacion_admin}
            </p>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Dato etiqueta="Categoría">{entrega.categoria || tipo.nombre}</Dato>
            <Dato etiqueta="Cantidad">
              {entrega.cantidad} {entrega.unidad}
            </Dato>
            <Dato etiqueta="Peso">
              {entrega.peso ? formatearKg(entrega.peso) : 'Sin registrar'}
            </Dato>
            <Dato etiqueta="Estado de conservación">
              {conservacion || 'Sin especificar'}
            </Dato>
          </dl>

          <Dato etiqueta="Punto ecológico">
            {entrega.punto_nombre || `Punto #${entrega.punto_id}`}
            {entrega.punto_direccion && (
              <span className="block text-xs font-medium text-gray-500 dark:text-[#a8b3ae] mt-0.5">
                📍 {entrega.punto_direccion}
              </span>
            )}
          </Dato>

          {entrega.observacion && (
            <Dato etiqueta="Tu observación">{entrega.observacion}</Dato>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-wide font-bold text-gray-400 dark:text-[#a8b3ae] mb-2">
              Fotografía
            </p>
            {entrega.foto_url && fotoRota ? (
              <p className="text-xs text-gray-500 dark:text-[#a8b3ae]">
                No se pudo cargar la imagen.{' '}
                <a
                  href={foto}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  Abrir el enlace
                </a>
              </p>
            ) : entrega.foto_url ? (
              <a href={foto} target="_blank" rel="noreferrer">
                <img
                  src={foto}
                  alt={`Foto de la entrega #${entrega.id}`}
                  onError={() => setFotoRota(true)}
                  className="w-full max-h-72 object-cover rounded-2xl border border-gray-100 dark:border-gray-800/40"
                />
              </a>
            ) : (
              <p className="text-xs text-gray-500 dark:text-[#a8b3ae]">
                No adjuntaste una foto en esta entrega.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// =========================================================
// PÁGINA
// =========================================================

function Historial() {
  const navigate = useNavigate()
  const prefiereReducido = useReducedMotion()

  const [entregas, setEntregas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [seleccionada, setSeleccionada] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Debes iniciar sesión para ver tu historial de entregas.')
      setCargando(false)
      return
    }

    const obtenerHistorial = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/entregas/mis-entregas`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!respuesta.ok) {
          throw new Error('No se pudo obtener el historial')
        }

        setEntregas(await respuesta.json())
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar tu historial.')
      } finally {
        setCargando(false)
      }
    }

    obtenerHistorial()
  }, [])

  const contar = (estado) => entregas.filter((e) => e.estado === estado).length

  const kgAportados = entregas
    .filter((e) => e.estado !== 'rechazada' && e.peso)
    .reduce((total, e) => total + e.peso, 0)

  const entregasFiltradas =
    filtro === 'todas' ? entregas : entregas.filter((e) => e.estado === filtro)

  // Mismos estilos que las tarjetas de resumen de "Mis puntos"
  const resumen = [
    {
      titulo: 'Mis entregas',
      valor: entregas.length,
      icono: '📦',
      fondoIcono: 'bg-emerald-50 dark:bg-emerald-950/20 text-[#218739] dark:text-[#2fa350]',
      colorValor: 'text-gray-900 dark:text-white',
      detalle: 'Total registradas',
      colorDetalle: 'text-gray-400 font-semibold'
    },
    {
      titulo: 'Kilos aportados',
      valor: formatearKg(kgAportados),
      icono: '⚖️',
      fondoIcono: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
      colorValor: 'text-gray-900 dark:text-white',
      detalle: 'Sin contar rechazadas',
      colorDetalle: 'text-gray-400 font-semibold'
    },
    {
      titulo: 'Pendientes',
      valor: contar('pendiente'),
      icono: '⏳',
      fondoIcono: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
      colorValor: 'text-amber-500 dark:text-amber-400',
      detalle: 'Esperando verificación',
      colorDetalle: 'text-amber-600/80 font-bold'
    },
    {
      titulo: 'Verificadas',
      valor: contar('verificada'),
      icono: '✓',
      fondoIcono: 'bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350]',
      colorValor: 'text-[#218739] dark:text-[#2fa350]',
      detalle: 'Confirmadas por un administrador',
      colorDetalle: 'text-green-600/80 font-bold'
    }
  ]

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] font-sans transition-colors duration-300 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
              Mis entregas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] font-medium mt-1">
              Consulta tus donaciones y reciclajes, y el estado de verificación de cada uno.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileHover={prefiereReducido ? {} : { scale: 1.03 }}
              whileTap={prefiereReducido ? {} : { scale: 0.97 }}
              onClick={() => navigate('/mapa')}
              className="px-5 py-2.5 bg-gradient-to-r from-[#218739] to-[#39aa53] dark:from-[#2fa350] dark:to-[#39aa53] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <span>♻️</span>
              <span>Registrar una entrega</span>
            </motion.button>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {resumen.map((tarjeta) => (
            <div
              key={tarjeta.titulo}
              className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs"
            >
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
                <span>{tarjeta.titulo}</span>
                <span className={`p-2 rounded-xl text-sm ${tarjeta.fondoIcono}`}>{tarjeta.icono}</span>
              </div>
              <div className={`mt-3 text-3xl font-black ${tarjeta.colorValor}`}>
                {cargando ? '...' : tarjeta.valor}
              </div>
              <p className={`text-[11px] mt-1 ${tarjeta.colorDetalle}`}>{tarjeta.detalle}</p>
            </div>
          ))}
        </section>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#d93025] text-xs font-bold text-[#d93025] dark:text-[#ef5350] rounded-r-xl">
            ⚠️ {error}
          </div>
        )}

        {/* LISTA */}
        {!error && (
          <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden transition-colors">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50/30 dark:bg-[#121816]/30">
              <div>
                <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                  Mis Entregas Registradas
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                  Haz clic en una entrega para ver el detalle completo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
                {FILTROS.map((f) => {
                  const activo = filtro === f.id
                  const total = f.id === 'todas' ? entregas.length : contar(f.id)

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFiltro(f.id)}
                      aria-pressed={activo}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        activo
                          ? 'bg-[#218739] dark:bg-[#2fa350] text-white border-transparent'
                          : 'bg-white dark:bg-[#121816] text-gray-600 dark:text-[#a8b3ae] border-gray-200 dark:border-gray-800/60 hover:border-[#218739]/40'
                      }`}
                    >
                      {f.nombre} <span className="opacity-70">({total})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {cargando ? (
              /* SKELETONS DE CARGA (igual que en Mis puntos) */
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex justify-between items-center gap-4 animate-pulse pb-4 border-b border-gray-50 dark:border-gray-800/30">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/2"></div>
                    </div>
                    <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : entregas.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl block mb-3">🍃</span>
                <h4 className="text-lg font-bold text-gray-800 dark:text-[#f2f5f3]">
                  Aún no tienes entregas registradas
                </h4>
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 max-w-sm mx-auto px-4 mb-6">
                  Cuando registres una donación o un reciclaje en un punto del mapa, aparecerá aquí.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/mapa')}
                  className="px-5 py-2.5 bg-[#218739] dark:bg-[#2fa350] hover:bg-[#176b2b] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Registrar mi primera entrega
                </button>
              </div>
            ) : entregasFiltradas.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl block mb-3">🔎</span>
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] max-w-sm mx-auto px-4">
                  No tienes entregas en estado “{FILTROS.find((f) => f.id === filtro)?.nombre.toLowerCase()}”.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800/40">
                {entregasFiltradas.map((entrega) => {
                  const tipo = tipoEntrega(entrega)

                  return (
                    <motion.li
                      key={entrega.id}
                      layout={!prefiereReducido}
                    >
                      <button
                        type="button"
                        onClick={() => setSeleccionada(entrega)}
                        className="w-full text-left p-6 flex items-center gap-4 hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors cursor-pointer"
                      >
                        <span className="w-11 h-11 shrink-0 rounded-2xl bg-green-50 dark:bg-green-950/20 flex items-center justify-center text-xl">
                          {tipo.icono}
                        </span>

                        <span className="flex-1 min-w-0 space-y-1">
                          <span className="block font-extrabold text-sm sm:text-base text-gray-900 dark:text-[#f2f5f3] truncate">
                            {entrega.nombre_articulo || tipo.nombre}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-[#a8b3ae] truncate">
                            {entrega.cantidad} {entrega.unidad}
                            {entrega.peso && entrega.unidad !== 'kg' ? ` · ${formatearKg(entrega.peso)}` : ''}
                            {' · '}
                            {entrega.punto_nombre || `Punto #${entrega.punto_id}`}
                          </span>
                          <span className="block text-[11px] text-gray-400 font-medium">
                            📅 {formatearFecha(entrega.fecha)}
                          </span>
                        </span>

                        <BadgeEstado estado={entrega.estado} />
                      </button>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      <AnimatePresence>
        {seleccionada && (
          <DetalleEntrega
            entrega={seleccionada}
            onCerrar={() => setSeleccionada(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Historial
