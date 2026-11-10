import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

import { API_URL } from '../../config'
import { formatearMensajeError } from '../utils/puntoUtils'

const COMENTARIO_MAX = 500

const ETIQUETAS = {
  1: 'Muy malo: el punto no funciona',
  2: 'Malo: información incorrecta',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente'
}

// =========================================================
// ESTRELLAS (solo lectura)
// =========================================================

export function Estrellas({ valor = 0, tamano = 'text-sm' }) {
  const redondeado = Math.round(valor)

  return (
    <span
      className={`inline-flex ${tamano} leading-none`}
      role="img"
      aria-label={`${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 1 })} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className={n <= redondeado ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
        >
          ★
        </span>
      ))}
    </span>
  )
}

// =========================================================
// SELECTOR DE ESTRELLAS
// =========================================================

function SelectorEstrellas({ valor, onCambiar, deshabilitado }) {
  const [hover, setHover] = useState(0)
  const mostrado = hover || valor

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Calificación"
        className="flex gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            disabled={deshabilitado}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onCambiar(n)}
            className={`text-3xl leading-none px-0.5 transition-transform cursor-pointer disabled:cursor-not-allowed hover:scale-110 focus-visible:outline-2 focus-visible:outline-amber-500 rounded ${
              n <= mostrado ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1 h-4">
        {mostrado ? ETIQUETAS[mostrado] : 'Selecciona de 1 a 5 estrellas'}
      </p>
    </div>
  )
}

// =========================================================
// MODAL DE RESEÑAS DE UN PUNTO
// =========================================================

function ResenasPunto({ punto, onCerrar, onCalificacionActualizada }) {
  const token = localStorage.getItem('access_token')
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const esCreador = usuario && usuario.id === punto.usuario_id

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [puntuacion, setPuntuacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const cargar = async () => {
    try {
      setCargando(true)
      setErrorCarga('')

      const respuesta = await fetch(`${API_URL}/puntos/${punto.id}/resenas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      if (!respuesta.ok) throw new Error('No se pudieron cargar las reseñas')

      const resultado = await respuesta.json()
      setDatos(resultado)

      if (resultado.mi_resena) {
        setPuntuacion(resultado.mi_resena.puntuacion)
        setComentario(resultado.mi_resena.comentario ?? '')
      }

      return resultado
    } catch (err) {
      console.error(err)
      setErrorCarga(err.message)
      return null
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [punto.id])

  useEffect(() => {
    const alPresionar = (e) => e.key === 'Escape' && !guardando && onCerrar()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [guardando, onCerrar])

  const notificar = (resumen) => {
    onCalificacionActualizada?.(punto.id, {
      calificacion_promedio: resumen.calificacion_promedio,
      total_resenas: resumen.total_resenas
    })
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!puntuacion) {
      setError('Selecciona una calificación de 1 a 5 estrellas')
      return
    }

    try {
      setGuardando(true)

      const respuesta = await fetch(`${API_URL}/puntos/${punto.id}/resenas`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          puntuacion,
          comentario: comentario.trim() || null
        })
      })

      const resultado = await respuesta.json().catch(() => null)

      if (!respuesta.ok) {
        setError(formatearMensajeError(resultado?.detail, 'No se pudo guardar tu reseña'))
        return
      }

      setMensaje(
        resultado.mensaje === 'Reseña actualizada'
          ? 'Actualizamos tu reseña.'
          : '¡Gracias! Tu reseña quedó publicada.'
      )
      notificar(resultado)
      await cargar()
    } catch (err) {
      console.error(err)
      setError('No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!window.confirm('¿Eliminar tu reseña de este punto?')) return

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const respuesta = await fetch(`${API_URL}/puntos/${punto.id}/resenas`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const resultado = await respuesta.json().catch(() => null)

      if (!respuesta.ok) {
        setError(formatearMensajeError(resultado?.detail, 'No se pudo eliminar tu reseña'))
        return
      }

      setPuntuacion(0)
      setComentario('')
      setMensaje('Eliminamos tu reseña.')
      notificar(resultado)
      await cargar()
    } catch (err) {
      console.error(err)
      setError('No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const total = datos?.total_resenas ?? 0
  const maximoDistribucion = Math.max(...Object.values(datos?.distribucion ?? { 0: 0 }), 1)
  const otrasResenas = (datos?.resenas ?? []).filter((r) => r.usuario_id !== usuario?.id)

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-resenas"
      onClick={() => !guardando && onCerrar()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1a2320] text-gray-900 dark:text-white rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO */}
        <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <p className="text-[11px] uppercase tracking-wide font-bold text-amber-600 dark:text-amber-400 pr-10">
            Reseñas del punto
          </p>
          <h2 id="titulo-resenas" className="text-xl font-extrabold pr-10 mt-0.5">
            {punto.nombre}
          </h2>

          {/* RESUMEN */}
          <div className="mt-4 flex items-center gap-5">
            <div className="text-center shrink-0">
              <div className="text-4xl font-black tabular-nums">
                {total ? Number(datos.calificacion_promedio).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '–'}
              </div>
              <Estrellas valor={datos?.calificacion_promedio ?? 0} />
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {total === 1 ? '1 reseña' : `${total} reseñas`}
              </div>
            </div>

            <ul className="flex-1 space-y-1" aria-label="Distribución de calificaciones">
              {[5, 4, 3, 2, 1].map((n) => {
                const cantidad = datos?.distribucion?.[n] ?? 0
                return (
                  <li key={n} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <span className="w-6 tabular-nums">{n} ★</span>
                    <span className="flex-1 h-2 rounded-full bg-amber-50 dark:bg-amber-950/30 overflow-hidden" aria-hidden="true">
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{ width: `${(cantidad / maximoDistribucion) * 100}%` }}
                      />
                    </span>
                    <span className="w-5 text-right tabular-nums">{cantidad}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* FORMULARIO */}
          {!token ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              🔒 Inicia sesión para calificar este punto.
            </p>
          ) : esCreador ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              Propusiste este punto, así que no puedes calificarlo. Aquí ves lo que opina la comunidad.
            </p>
          ) : (
            <form onSubmit={enviar} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {datos?.mi_resena ? 'Tu reseña (puedes editarla)' : '¿Cómo te fue en este punto?'}
                </p>
                <SelectorEstrellas
                  valor={puntuacion}
                  onCambiar={(n) => {
                    setPuntuacion(n)
                    setError('')
                    setMensaje('')
                  }}
                  deshabilitado={guardando}
                />
              </div>

              <div>
                <label htmlFor="comentario-resena" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Comentario
                  <span className="font-normal text-gray-400 ml-1">(opcional)</span>
                </label>
                <textarea
                  id="comentario-resena"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  maxLength={COMENTARIO_MAX}
                  rows={3}
                  disabled={guardando}
                  placeholder="¿Estaba abierto? ¿La información del mapa es correcta?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
                />
                <p className="text-[10px] font-bold text-gray-400 text-right">
                  {comentario.length}/{COMENTARIO_MAX}
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  ⚠️ {error}
                </div>
              )}

              {mensaje && (
                <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                  ✅ {mensaje}
                </div>
              )}

              <div className="flex gap-3">
                {datos?.mi_resena && (
                  <button
                    type="button"
                    onClick={eliminar}
                    disabled={guardando}
                    className="px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition cursor-pointer disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-sm cursor-pointer"
                >
                  {guardando
                    ? 'Guardando...'
                    : datos?.mi_resena
                    ? 'Actualizar reseña'
                    : 'Enviar reseña'}
                </button>
              </div>
            </form>
          )}

          {/* LISTA */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-3">
              Lo que dice la comunidad
            </h3>

            {cargando && !datos ? (
              <p className="text-sm text-gray-400">Cargando reseñas…</p>
            ) : errorCarga ? (
              <p className="text-sm text-red-600 dark:text-red-400">⚠️ {errorCarga}</p>
            ) : otrasResenas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {total === 0
                  ? 'Este punto aún no tiene reseñas. ¡Sé el primero en calificarlo!'
                  : 'Por ahora solo está tu reseña.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {otrasResenas.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-gray-100 dark:border-gray-800/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold truncate">{r.nombre_usuario}</span>
                      <Estrellas valor={r.puntuacion} tamano="text-xs" />
                    </div>
                    {r.comentario && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 break-words">
                        {r.comentario}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {new Date(r.fecha_actualizacion).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {r.fecha_actualizacion !== r.fecha && ' · editada'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default ResenasPunto
