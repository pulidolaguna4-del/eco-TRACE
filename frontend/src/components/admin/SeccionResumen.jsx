// =========================================================
// RESUMEN DEL PANEL
// =========================================================
// Saludo con las tareas por revisar, indicadores principales,
// la bandeja de "requiere tu atención", el estado de puntos y
// entregas y la actividad reciente.

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { claseTarjeta, anilloFoco, Insignia, Avatar } from './ui'
import { formatearNumero, haceCuanto, kgDeEntrega, TIPOS_ENTREGA, ESTADO_A_INSIGNIA, NOMBRE_ESTADO } from './utilidades'

function useContador(valorFinal, duracion = 0.9) {
  const [valor, setValor] = useState(0)
  const reducido = useReducedMotion()
  const anterior = useRef(0)

  useEffect(() => {
    if (reducido) {
      setValor(valorFinal)
      anterior.current = valorFinal
      return
    }
    const desde = anterior.current
    let inicio = null
    let id
    const paso = (t) => {
      if (inicio === null) inicio = t
      const f = Math.min((t - inicio) / (duracion * 1000), 1)
      const actual = desde + (valorFinal - desde) * (1 - Math.pow(1 - f, 3))
      setValor(actual)
      if (f < 1) id = requestAnimationFrame(paso)
      else anterior.current = valorFinal
    }
    id = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(id)
  }, [valorFinal, duracion, reducido])

  return valor
}

function Indicador({ icono, etiqueta, valor, decimales = 0, sufijo, detalle, cargando }) {
  const animado = useContador(cargando ? 0 : valor)

  return (
    <div className={`${claseTarjeta} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">{etiqueta}</p>
        <span className="w-9 h-9 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/10 dark:border-gray-800 flex items-center justify-center text-base" aria-hidden="true">
          {icono}
        </span>
      </div>
      {cargando ? (
        <div className="mt-3 h-9 w-20 rounded-lg bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
      ) : (
        <p className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
          {formatearNumero(animado, decimales)}
          {sufijo && <span className="text-base font-extrabold text-gray-500 dark:text-[#a8b3ae] ml-1">{sufijo}</span>}
        </p>
      )}
      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">{detalle}</p>
    </div>
  )
}

function BarraApilada({ segmentos, etiqueta }) {
  const reducido = useReducedMotion()
  const total = segmentos.reduce((s, x) => s + x.valor, 0)
  const resumen = segmentos.map((s) => `${s.nombre}: ${s.valor}`).join(', ')

  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-[#0f1512] gap-0.5" role="img" aria-label={`${etiqueta}. ${resumen}`}>
        {total > 0 &&
          segmentos
            .filter((s) => s.valor > 0)
            .map((s) => (
              <motion.div
                key={s.nombre}
                initial={{ width: reducido ? `${(s.valor / total) * 100}%` : 0 }}
                animate={{ width: `${(s.valor / total) * 100}%` }}
                transition={{ duration: reducido ? 0 : 0.9, ease: 'easeOut' }}
                className={s.clase}
              />
            ))}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {segmentos.map((s) => (
          <li key={s.nombre}>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-[#a8b3ae]">
              <span className={`w-2.5 h-2.5 rounded-sm ${s.clase}`} aria-hidden="true" />
              {s.nombre}
            </span>
            <span className="block text-lg font-black text-gray-900 dark:text-white tabular-nums mt-0.5">
              {s.valor}
              <span className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae] ml-1">
                {total > 0 ? `${Math.round((s.valor / total) * 100)}%` : '0%'}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FilaAtencion({ icono, titulo, descripcion, total, tono, onClick }) {
  const tonos = {
    amber: 'bg-amber-500 text-amber-950',
    red: 'bg-red-600 text-white',
    gris: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-[#a8b3ae]'
  }

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group w-full flex items-center gap-4 p-3 -mx-3 rounded-2xl text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${anilloFoco}`}
      >
        <span className="w-11 h-11 shrink-0 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/10 dark:border-gray-800 flex items-center justify-center text-lg" aria-hidden="true">
          {icono}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-extrabold text-gray-900 dark:text-white">{titulo}</span>
          <span className="block text-xs text-gray-500 dark:text-[#a8b3ae] truncate">{descripcion}</span>
        </span>
        <span className={`min-w-8 h-7 px-2 rounded-full text-xs font-black flex items-center justify-center tabular-nums ${total > 0 ? tonos[tono] : tonos.gris}`}>
          {total}
        </span>
        <span className="text-gray-400 group-hover:text-[#218739] dark:group-hover:text-[#2fa350] group-hover:translate-x-0.5 transition-all" aria-hidden="true">
          →
        </span>
      </button>
    </li>
  )
}

export default function SeccionResumen({ nombreAdmin, usuarios, todosLosPuntos, puntosPendientes, entregas, reportes, cargando, irA }) {
  const aprobados = todosLosPuntos.filter((p) => p.estado === 'aprobado').length
  const rechazados = todosLosPuntos.filter((p) => p.estado === 'rechazado').length
  const pendientesTotal = todosLosPuntos.filter((p) => p.estado !== 'aprobado' && p.estado !== 'rechazado').length
  const prioritarios = todosLosPuntos.filter((p) => p.revision_prioritaria).length

  const entregasPendientes = entregas.filter((e) => e.estado === 'pendiente').length
  const entregasVerificadas = entregas.filter((e) => e.estado === 'verificada')
  const entregasRechazadas = entregas.filter((e) => e.estado === 'rechazada').length
  const kgVerificados = entregasVerificadas.reduce((s, e) => s + kgDeEntrega(e), 0)

  const reportesPendientes = reportes.filter((r) => (r.estado || 'pendiente') === 'pendiente').length

  const tareas = puntosPendientes.length + entregasPendientes + reportesPendientes + prioritarios

  const primeraTarea = puntosPendientes.length
    ? 'pendientes'
    : entregasPendientes
      ? 'entregas'
      : reportesPendientes
        ? 'reportes'
        : prioritarios
          ? 'puntos'
          : null

  const recientes = [...entregas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5)

  const primerNombre = nombreAdmin?.trim()?.split(' ')[0] || 'administrador'

  return (
    <div className="space-y-6">
      {/* SALUDO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#176b2b] via-[#218739] to-[#2fa350] p-6 sm:p-8 text-white">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute right-10 -bottom-24 w-56 h-56 rounded-full bg-[#7ee08f]/20 blur-2xl" aria-hidden="true" />

        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c9f5d1]">Hola, {primerNombre}</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight max-w-xl">
              {cargando
                ? 'Revisando la actividad de la comunidad...'
                : tareas > 0
                  ? `Tienes ${tareas} ${tareas === 1 ? 'tarea' : 'tareas'} por revisar`
                  : 'Todo está al día'}
            </h2>
            <p className="mt-2 text-sm text-white/85 max-w-lg">
              {tareas > 0
                ? 'Aprueba los puntos nuevos, verifica las entregas y atiende los reportes para que el mapa siga siendo confiable.'
                : 'No hay puntos, entregas ni reportes esperando tu decisión.'}
            </p>
          </div>

          {primeraTarea && !cargando && (
            <button
              type="button"
              onClick={() => irA(primeraTarea, primeraTarea === 'puntos' ? 'prioritaria' : undefined)}
              className="self-start md:self-auto inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-white text-[#176b2b] text-sm font-extrabold hover:bg-white/90 shadow-lg cursor-pointer transition-colors"
            >
              Empezar a revisar <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>

      {/* INDICADORES */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Indicador icono="👥" etiqueta="Usuarios" valor={usuarios.length} detalle="Cuentas registradas" cargando={cargando} />
        <Indicador icono="📍" etiqueta="Puntos en el mapa" valor={aprobados} detalle={`de ${todosLosPuntos.length} propuestos`} cargando={cargando} />
        <Indicador icono="♻️" etiqueta="Entregas verificadas" valor={entregasVerificadas.length} detalle={`de ${entregas.length} registradas`} cargando={cargando} />
        <Indicador icono="⚖️" etiqueta="Kg reciclados" valor={kgVerificados} decimales={1} sufijo="kg" detalle="En entregas verificadas" cargando={cargando} />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* REQUIERE TU ATENCIÓN */}
        <section className={`${claseTarjeta} p-6 lg:col-span-3`} aria-labelledby="titulo-atencion">
          <h3 id="titulo-atencion" className="text-base font-black text-gray-900 dark:text-white">Requiere tu atención</h3>
          <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">Elige una bandeja para empezar.</p>

          <ul className="mt-4 space-y-1">
            <FilaAtencion icono="⏳" titulo="Puntos por aprobar" descripcion="Propuestas nuevas de la comunidad" total={puntosPendientes.length} tono="amber" onClick={() => irA('pendientes')} />
            <FilaAtencion icono="♻️" titulo="Entregas por verificar" descripcion="Entregas y donaciones registradas en los puntos" total={entregasPendientes} tono="amber" onClick={() => irA('entregas', 'pendiente')} />
            <FilaAtencion icono="🚩" titulo="Reportes abiertos" descripcion="Avisos de información incorrecta" total={reportesPendientes} tono="red" onClick={() => irA('reportes', 'pendiente')} />
            <FilaAtencion icono="⚠️" titulo="Revisión prioritaria" descripcion="Puntos con muchas reseñas negativas recientes" total={prioritarios} tono="amber" onClick={() => irA('puntos', 'prioritaria')} />
          </ul>
        </section>

        {/* ESTADOS */}
        <section className={`${claseTarjeta} p-6 lg:col-span-2 space-y-7`} aria-label="Estado de puntos y entregas">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">Estado de los puntos</h3>
            <BarraApilada
              etiqueta="Estado de los puntos"
              segmentos={[
                { nombre: 'Aprobados', valor: aprobados, clase: 'bg-[#218739] dark:bg-[#2fa350]' },
                { nombre: 'Pendientes', valor: pendientesTotal, clase: 'bg-amber-400' },
                { nombre: 'Rechazados', valor: rechazados, clase: 'bg-red-500' }
              ]}
            />
          </div>
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800/60">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">Estado de las entregas</h3>
            <BarraApilada
              etiqueta="Estado de las entregas"
              segmentos={[
                { nombre: 'Verificadas', valor: entregasVerificadas.length, clase: 'bg-[#218739] dark:bg-[#2fa350]' },
                { nombre: 'Pendientes', valor: entregasPendientes, clase: 'bg-amber-400' },
                { nombre: 'Rechazadas', valor: entregasRechazadas, clase: 'bg-red-500' }
              ]}
            />
          </div>
        </section>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <section className={`${claseTarjeta} p-6`} aria-labelledby="titulo-recientes">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 id="titulo-recientes" className="text-base font-black text-gray-900 dark:text-white">Últimas entregas</h3>
            <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">Lo más reciente que registraron los usuarios.</p>
          </div>
          <button type="button" onClick={() => irA('entregas')} className={`text-xs font-bold text-[#218739] dark:text-[#2fa350] hover:underline underline-offset-2 cursor-pointer rounded ${anilloFoco}`}>
            Ver todas
          </button>
        </div>

        {recientes.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500 dark:text-[#a8b3ae]">{cargando ? 'Cargando...' : 'Todavía no hay entregas registradas.'}</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800/60">
            {recientes.map((e) => {
              const tipo = TIPOS_ENTREGA[e.tipo] || TIPOS_ENTREGA.reciclaje
              return (
                <li key={e.id} className="flex items-center gap-3 py-3">
                  <Avatar nombre={e.usuario_nombre} tamaño="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      <span className="font-extrabold">{e.usuario_nombre}</span>
                      <span className="text-gray-500 dark:text-[#a8b3ae]"> entregó {formatearNumero(e.cantidad, 2)} {e.unidad} de {tipo.nombre.toLowerCase()} en </span>
                      <span className="font-bold">{e.punto_nombre}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#a8b3ae]">{haceCuanto(e.fecha)}</p>
                  </div>
                  <Insignia tipo={ESTADO_A_INSIGNIA[e.estado]}>{NOMBRE_ESTADO[e.estado] || e.estado}</Insignia>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
