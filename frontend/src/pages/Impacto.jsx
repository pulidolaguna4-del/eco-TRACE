import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import { CATEGORIAS_DISPONIBLES } from '../utils/puntoUtils'

// =========================================================
// FORMATO
// =========================================================

const numero = (valor, decimales = 0) =>
  Number(valor ?? 0).toLocaleString('es-CO', {
    maximumFractionDigits: decimales
  })

// 1.284 · 12,9 mil · 4,2 M
const compacto = (valor) =>
  Number(valor ?? 0).toLocaleString('es-CO', {
    notation: valor >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  })

function iconoCategoria(nombre) {
  return CATEGORIAS_DISPONIBLES.find((c) => c.nombre === nombre)?.icono ?? '📦'
}

// =========================================================
// COMPONENTES
// =========================================================

function Tile({ etiqueta, valor, unidad, detalle, icono, destacado = false, cargando }) {
  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border shadow-2xs transition-colors ${
        destacado
          ? 'bg-gradient-to-br from-[#218739] to-[#2fa350] border-transparent text-white'
          : 'bg-white dark:bg-[#1a2320] border-gray-100 dark:border-gray-800/40'
      }`}
    >
      <div
        className={`flex justify-between items-center text-xs font-bold ${
          destacado ? 'text-white/80' : 'text-gray-500 dark:text-[#a8b3ae]'
        }`}
      >
        <span>{etiqueta}</span>
        <span className="text-base" aria-hidden="true">{icono}</span>
      </div>

      <div
        className={`mt-3 font-black tabular-nums ${
          destacado ? 'text-5xl' : 'text-3xl text-gray-900 dark:text-white'
        }`}
      >
        {cargando ? '…' : valor}
        {unidad && !cargando && (
          <span className={`ml-1.5 font-bold ${destacado ? 'text-xl text-white/80' : 'text-base text-gray-400'}`}>
            {unidad}
          </span>
        )}
      </div>

      {detalle && (
        <p
          className={`text-[11px] mt-1.5 font-semibold ${
            destacado ? 'text-white/80' : 'text-gray-400 dark:text-[#a8b3ae]'
          }`}
        >
          {detalle}
        </p>
      )}
    </div>
  )
}

// Barras horizontales ordenadas, un solo tono. Si hay una categoría
// filtrada, esa fila queda en verde y las demás en gris (énfasis).
function AportePorCategoria({ filas, seleccionada }) {
  const [enfocada, setEnfocada] = useState(null)

  const ordenadas = [...filas].sort((a, b) => b.kg_reciclados - a.kg_reciclados)
  const maximo = Math.max(...ordenadas.map((f) => f.kg_reciclados), 0)
  const totalKg = ordenadas.reduce((suma, f) => suma + f.kg_reciclados, 0)

  return (
    <ul className="space-y-4">
      {ordenadas.map((fila) => {
        const nombre = fila.categoria ?? 'Sin categoría'
        const ancho = maximo > 0 ? (fila.kg_reciclados / maximo) * 100 : 0
        const atenuada = seleccionada && seleccionada !== fila.categoria
        const porcentaje = totalKg > 0 ? (fila.kg_reciclados / totalKg) * 100 : 0
        const activa = enfocada === nombre

        return (
          <li
            key={nombre}
            tabIndex={0}
            onMouseEnter={() => setEnfocada(nombre)}
            onMouseLeave={() => setEnfocada(null)}
            onFocus={() => setEnfocada(nombre)}
            onBlur={() => setEnfocada(null)}
            className="relative grid grid-cols-1 sm:grid-cols-[12rem_1fr_auto] items-center gap-x-4 gap-y-1.5 rounded-xl px-2 py-1.5 -mx-2 outline-none focus-visible:ring-2 focus-visible:ring-[#218739] hover:bg-gray-50 dark:hover:bg-gray-800/20"
          >
            <span className="text-sm font-bold text-gray-800 dark:text-[#f2f5f3] flex items-center gap-2 min-w-0">
              <span aria-hidden="true">{iconoCategoria(fila.categoria)}</span>
              <span className="truncate">{nombre}</span>
            </span>

            <span className="h-3 rounded-full bg-green-50 dark:bg-green-950/30 overflow-hidden" aria-hidden="true">
              <span
                className={`block h-full rounded-full transition-[width,background-color] duration-500 ${
                  atenuada
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-[#218739] dark:bg-[#2fa350]'
                }`}
                style={{ width: `${fila.kg_reciclados > 0 ? Math.max(ancho, 1.5) : 0}%` }}
              />
            </span>

            <span className="text-xs text-gray-500 dark:text-[#a8b3ae] tabular-nums whitespace-nowrap sm:text-right">
              <strong className="text-sm text-gray-900 dark:text-white">
                {numero(fila.kg_reciclados, 1)} kg
              </strong>
              {' · '}
              {numero(fila.total_entregas)} entregas
              {fila.categoria && <> · {numero(fila.puntos_activos)} puntos</>}
            </span>

            {activa && (
              <span
                role="tooltip"
                className="absolute right-2 -top-9 z-10 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[11px] font-semibold shadow-lg whitespace-nowrap pointer-events-none"
              >
                {nombre}: {numero(porcentaje, 1)} % de los kilos reciclados
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// =========================================================
// PÁGINA
// =========================================================

function Impacto() {
  const navigate = useNavigate()
  const prefiereReducido = useReducedMotion()

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
  const esAdmin = Boolean(usuario?.es_admin)

  const [categoria, setCategoria] = useState(null)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controlador = new AbortController()
    const token = localStorage.getItem('access_token')

    const cargar = async () => {
      try {
        setCargando(true)
        setError('')

        const url = new URL(`${API_URL}/impacto`)
        if (categoria) url.searchParams.set('categoria', categoria)

        const respuesta = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controlador.signal
        })

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar las estadísticas de impacto')
        }

        setDatos(await respuesta.json())
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error(err)
        setError(err.message)
      } finally {
        if (!controlador.signal.aborted) setCargando(false)
      }
    }

    cargar()
    return () => controlador.abort()
  }, [categoria])

  const sinDatos = !cargando && datos && datos.total_entregas === 0

  const filtros = [
    { id: null, nombre: 'Todas', icono: '🌎' },
    ...CATEGORIAS_DISPONIBLES.map((c) => ({ id: c.nombre, nombre: c.nombre, icono: c.icono }))
  ]

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] font-sans transition-colors duration-300 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={prefiereReducido ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-6xl mx-auto space-y-8"
      >

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
              Impacto de la comunidad
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] font-medium mt-1 max-w-2xl">
              Lo que los vecinos de Ciudad Bolívar han reciclado y donado en los puntos ecológicos de eco-TRACE.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/mapa')}
            className="self-start md:self-auto px-5 py-2.5 bg-gradient-to-r from-[#218739] to-[#39aa53] dark:from-[#2fa350] dark:to-[#39aa53] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            ♻️ Suma tu entrega
          </button>
        </div>

        {/* FILTRO POR CATEGORÍA */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          {filtros.map((f) => {
            const activo = categoria === f.id

            return (
              <button
                key={f.nombre}
                type="button"
                onClick={() => setCategoria(f.id)}
                aria-pressed={activo}
                className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activo
                    ? 'bg-[#218739] dark:bg-[#2fa350] text-white border-transparent'
                    : 'bg-white dark:bg-[#1a2320] text-gray-600 dark:text-[#a8b3ae] border-gray-200 dark:border-gray-800/60 hover:border-[#218739]/40'
                }`}
              >
                <span aria-hidden="true">{f.icono}</span>
                {f.nombre}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#d93025] text-xs font-bold text-[#d93025] dark:text-[#ef5350] rounded-r-xl">
            ⚠️ {error}
          </div>
        )}

        {sinDatos && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-xs font-semibold text-blue-800 dark:text-blue-300 rounded-xl">
            ℹ️ {categoria
              ? `Todavía no hay entregas registradas en ${categoria}.`
              : 'Todavía no hay entregas registradas. Cuando la comunidad registre sus entregas en el mapa, las cifras aparecerán aquí.'}
          </div>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="Estadísticas generales">
          <div className="sm:col-span-2 lg:col-span-1 lg:row-span-1">
            <Tile
              destacado
              etiqueta="Kilos reciclados"
              icono="⚖️"
              valor={compacto(datos?.kg_reciclados)}
              unidad="kg"
              cargando={cargando && !datos}
              detalle={
                datos?.entregas_por_verificar
                  ? `Incluye ${numero(datos.entregas_por_verificar)} entregas por verificar`
                  : 'Entregas verificadas'
              }
            />
          </div>

          <Tile
            etiqueta="Entregas y donaciones"
            icono="📦"
            valor={compacto(datos?.total_entregas)}
            cargando={cargando && !datos}
            detalle="Sin contar las rechazadas"
          />

          <Tile
            etiqueta="Puntos activos"
            icono="📍"
            valor={compacto(datos?.puntos_activos)}
            cargando={cargando && !datos}
            detalle="Aprobados y visibles en el mapa"
          />

          <Tile
            etiqueta="Vecinos participando"
            icono="🤝"
            valor={compacto(datos?.usuarios_participantes)}
            cargando={cargando && !datos}
            detalle="Con al menos una entrega"
          />
        </section>

        {/* REUTILIZACIÓN (REGALOS): se cuenta aparte del reciclaje */}
        {datos?.regalos && (
          <section className="space-y-4" aria-labelledby="titulo-reutilizacion">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 id="titulo-reutilizacion" className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                  🎁 Reutilización con Regalos
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 max-w-2xl">
                  Lo que los vecinos se regalaron en lugar de botarlo. Se cuenta aparte de los kilos reciclados
                  {categoria ? ' y no cambia con el filtro de categoría.' : '.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/regalos')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1a2320] text-[#176b2b] dark:text-[#2fa350] border border-gray-200 dark:border-gray-800/60 hover:border-[#218739]/40 cursor-pointer"
              >
                Ver regalos →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Tile
                etiqueta="Kilos reutilizados"
                icono="♻️"
                valor={numero(datos.regalos.kg_reutilizados, 1)}
                unidad="kg"
                detalle="De los regalos entregados en kg"
              />
              <Tile
                etiqueta="Regalos entregados"
                icono="🤝"
                valor={compacto(datos.regalos.regalos_entregados)}
                detalle="Objetos que encontraron un nuevo dueño"
              />
              <Tile
                etiqueta="Disponibles ahora"
                icono="🎁"
                valor={compacto(datos.regalos.regalos_disponibles)}
                detalle="Publicados y esperando a alguien"
              />
            </div>
          </section>
        )}

        {/* APORTE POR CATEGORÍA */}
        <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
              Kilos reciclados por categoría
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
              Comparación entre categorías. Las entregas en prendas o unidades suman solo si el usuario indicó el peso.
            </p>
          </div>

          {datos?.por_categoria?.length ? (
            <AportePorCategoria filas={datos.por_categoria} seleccionada={categoria} />
          ) : (
            <p className="text-sm text-gray-400">{cargando ? 'Cargando…' : 'Sin datos todavía.'}</p>
          )}
        </section>

        {/* VISTA AMPLIADA PARA ADMINISTRADOR */}
        {esAdmin && datos?.admin && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 text-[11px] font-extrabold">
                👑 Solo administradores
              </span>
              <h2 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                Estado de la plataforma
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Tile
                etiqueta="Usuarios activos"
                icono="👥"
                valor={compacto(datos.admin.usuarios_activos)}
                detalle={`De ${numero(datos.admin.usuarios_registrados)} registrados · con entregas o puntos`}
              />
              <Tile
                etiqueta="Puntos por revisar"
                icono="⏳"
                valor={compacto(datos.admin.puntos_pendientes)}
                detalle="Propuestas pendientes de aprobación"
              />
              <Tile
                etiqueta="Entregas por verificar"
                icono="🔎"
                valor={compacto(datos.admin.entregas_pendientes)}
                detalle="En el panel de administración"
              />
              <Tile
                etiqueta="Reportes abiertos"
                icono="🚩"
                valor={compacto(datos.admin.reportes_pendientes)}
                detalle="Información incorrecta reportada"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 cursor-pointer"
            >
              Ir al panel de administración →
            </button>
          </section>
        )}
      </motion.div>
    </div>
  )
}

export default Impacto
