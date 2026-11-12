// =========================================================
// MIS REPORTES
// =========================================================
// El usuario ve los reportes que envió sobre puntos con información
// incorrecta, en qué estado están y lo que respondió el administrador.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import { formatearMensajeError } from '../utils/puntoUtils'
import { claseTarjeta, anilloFoco, EstadoVacio, Esqueleto, FiltroChips, Insignia } from '../components/admin/ui'
import { formatearFecha, haceCuanto, variantesItem } from '../components/admin/utilidades'

const ESTADOS = {
  pendiente: { nombre: 'En revisión', insignia: 'pendiente' },
  revisado: { nombre: 'Revisado', insignia: 'aprobado' },
  descartado: { nombre: 'Descartado', insignia: 'neutro' }
}

const claseBotonEnlace = `inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-xl text-xs font-bold transition-colors ${anilloFoco}`

function Respuesta({ reporte }) {
  if (reporte.estado === 'pendiente') {
    return (
      <p className="flex items-start gap-2 text-xs text-gray-600 dark:text-[#a8b3ae]">
        <span aria-hidden="true">⏳</span>
        Un administrador revisará tu reporte pronto. Aquí verás su respuesta.
      </p>
    )
  }

  const revisado = reporte.estado === 'revisado'

  return (
    <div
      className={`rounded-2xl border p-4 ${
        revisado
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/40'
          : 'bg-gray-50 dark:bg-[#0f1512] border-gray-200 dark:border-gray-800/60'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-sm" aria-hidden="true">
          👑
        </span>
        <p className="text-xs font-extrabold text-gray-900 dark:text-white">Respuesta del administrador</p>
      </div>

      {reporte.observacion_admin ? (
        <p className="mt-2.5 text-sm text-gray-800 dark:text-[#f2f5f3] whitespace-pre-wrap break-words leading-relaxed">
          {reporte.observacion_admin}
        </p>
      ) : (
        <p className="mt-2.5 text-sm text-gray-600 dark:text-[#a8b3ae]">
          {revisado
            ? 'Revisó tu reporte y tuvo en cuenta tu aviso, pero no dejó comentarios.'
            : 'Revisó tu reporte y no encontró un problema con la información del punto.'}
        </p>
      )}
    </div>
  )
}

function MisReportes() {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  const token = localStorage.getItem('access_token')

  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(Boolean(token))
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    if (!token) return

    const cargar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/reportes/mis-reportes`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const datos = await respuesta.json().catch(() => null)

        if (respuesta.status === 401) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')
        if (!respuesta.ok) throw new Error(formatearMensajeError(datos?.detail, 'No pudimos cargar tus reportes.'))

        setReportes(Array.isArray(datos) ? datos : [])
      } catch (err) {
        console.error(err)
        setError(err.message || 'No pudimos conectar con el servidor.')
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [token])

  // Sin sesión
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f1f8f4] dark:bg-[#0f1512] flex items-center justify-center p-4">
        <EstadoVacio icono="🔒" titulo="Inicia sesión para ver tus reportes" descripcion="Aquí aparecen los reportes que envías y lo que responde el administrador.">
          <Link to="/login" className={`${claseBotonEnlace} text-white bg-[#176b2b] hover:bg-[#218739]`}>
            Iniciar sesión
          </Link>
        </EstadoVacio>
      </div>
    )
  }

  const contar = (estado) => reportes.filter((r) => r.estado === estado).length
  const opciones = [
    { id: 'todos', nombre: 'Todos', total: reportes.length },
    { id: 'pendiente', nombre: 'En revisión', total: contar('pendiente') },
    { id: 'revisado', nombre: 'Revisados', total: contar('revisado') },
    { id: 'descartado', nombre: 'Descartados', total: contar('descartado') }
  ]

  const visibles = reportes.filter((r) => filtro === 'todos' || r.estado === filtro)
  const respondidos = reportes.filter((r) => r.estado !== 'pendiente').length

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f1f8f4] dark:bg-[#0f1512] text-gray-800 dark:text-[#f2f5f3]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* ENCABEZADO */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">Tu cuenta</p>
            <h1 className="mt-1.5 text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Mis reportes</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-[#a8b3ae] max-w-xl">
              Los avisos que enviaste sobre puntos con información incorrecta y lo que respondió el administrador.
            </p>
          </div>
          {!cargando && reportes.length > 0 && (
            <p className="text-xs font-bold text-gray-600 dark:text-[#a8b3ae] shrink-0">
              {respondidos} de {reportes.length} {reportes.length === 1 ? 'respondido' : 'respondidos'}
            </p>
          )}
        </header>

        {error && (
          <div role="alert" className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-sm font-bold text-red-800 dark:text-red-300">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {reportes.length > 0 && (
            <div className={`${claseTarjeta} p-4`}>
              <FiltroChips opciones={opciones} valor={filtro} onCambiar={setFiltro} etiqueta="Filtrar reportes por estado" />
            </div>
          )}

          {cargando ? (
            <Esqueleto filas={3} alto="h-44" />
          ) : reportes.length === 0 && !error ? (
            <EstadoVacio
              icono="🚩"
              titulo="Aún no has enviado reportes"
              descripcion="Si ves un punto con información incorrecta, repórtalo desde su ventana en el mapa."
            >
              <Link to="/mapa" className={`${claseBotonEnlace} text-white bg-[#176b2b] hover:bg-[#218739] dark:bg-[#218739] dark:hover:bg-[#2fa350]`}>
                Ir al mapa
              </Link>
            </EstadoVacio>
          ) : visibles.length === 0 && !error ? (
            <EstadoVacio icono="🔎" titulo="No hay reportes en esta lista" descripcion="Cambia el filtro para ver tus otros reportes." />
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {visibles.map((reporte) => {
                  const estado = ESTADOS[reporte.estado] || ESTADOS.pendiente
                  const enMapa = reporte.estado_punto === 'aprobado'

                  return (
                    <motion.li
                      key={reporte.id}
                      layout={!reducido}
                      variants={variantes}
                      initial="oculto"
                      animate="visible"
                      exit="salida"
                      className={`${claseTarjeta} p-5 sm:p-6`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="w-11 h-11 shrink-0 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 flex items-center justify-center text-lg" aria-hidden="true">
                            🚩
                          </span>
                          <div className="min-w-0">
                            <h2 className="text-base font-black text-gray-900 dark:text-white">{reporte.nombre_punto}</h2>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-[#a8b3ae]">
                              {reporte.direccion_punto && <>{reporte.direccion_punto} · </>}
                              <span title={formatearFecha(reporte.fecha_creacion)}>Enviado {haceCuanto(reporte.fecha_creacion)}</span>
                            </p>
                          </div>
                        </div>
                        <Insignia tipo={estado.insignia}>{estado.nombre}</Insignia>
                      </div>

                      {/* TU REPORTE */}
                      <blockquote className="mt-4 pl-4 border-l-4 border-gray-200 dark:border-gray-700">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-[#a8b3ae]">Tu reporte</p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-[#dce4e0] whitespace-pre-wrap break-words leading-relaxed">{reporte.motivo}</p>
                      </blockquote>

                      {/* RESPUESTA */}
                      <div className="mt-4">
                        <Respuesta reporte={reporte} />
                      </div>

                      {enMapa && (
                        <div className="mt-4 flex justify-end">
                          <Link
                            to={`/mapa?punto=${reporte.punto_id}`}
                            className={`${claseBotonEnlace} text-[#176b2b] dark:text-[#2fa350] bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/20 dark:border-gray-800 hover:bg-[#218739]/10 dark:hover:bg-[#2fa350]/10`}
                            aria-label={`Ver en el mapa el punto ${reporte.nombre_punto}`}
                          >
                            <span aria-hidden="true">🗺️</span> Ver en el mapa
                          </Link>
                        </div>
                      )}
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default MisReportes
