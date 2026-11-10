// =========================================================
// PANEL DE LA FOTO (LOGIN Y REGISTRO)
// =========================================================
// Cambia de foto, tarjeta y mensajes según el modo. Las fotos son de
// Mussi Katz en Wikimedia Commons, con licencia CC0.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { CONTENIDO } from './contenido'

const numero = (valor, decimales = 0) =>
  Number(valor ?? 0).toLocaleString('es-CO', { maximumFractionDigits: decimales })

function Tarjetas({ modo, impacto }) {
  const prefiereReducido = useReducedMotion()
  const esRegistro = modo === 'registro'

  return (
    <motion.div
      key={modo}
      initial={prefiereReducido ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // La salida es rápida y sin retraso: la tarjeta vieja no se queda
      exit={{ opacity: 0, transition: { duration: 0.15, delay: 0 } }}
      transition={{ duration: 0.45, delay: prefiereReducido ? 0 : 0.35 }}
      className="relative w-full max-w-sm"
    >
      <div className="rounded-3xl bg-white/95 dark:bg-[#1a2320]/95 backdrop-blur-md text-gray-900 dark:text-[#f2f5f3] p-6 shadow-2xl">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#218739] dark:text-[#2fa350]">
          {esRegistro ? 'Comunidad eco-TRACE' : 'Mapa comunitario'}
        </p>
        <h2 className="text-2xl font-black leading-tight mt-1">
          {esRegistro ? (
            <>Suma tu barrio<br />al mapa</>
          ) : (
            <>Recicla cerca<br />de tu casa</>
          )}
        </h2>
        <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-2 leading-relaxed">
          {esRegistro
            ? impacto
              ? `${numero(impacto.usuarios_participantes)} vecinos ya registran sus entregas. ¡Falta la tuya!`
              : 'Tus vecinos ya registran sus entregas. ¡Falta la tuya!'
            : impacto
              ? `${numero(impacto.puntos_activos)} puntos ecológicos verificados te esperan en el mapa.`
              : 'Puntos ecológicos verificados por tus vecinos, en un solo mapa.'}
        </p>
        <Link
          to={esRegistro ? '/impacto' : '/mapa'}
          className="inline-flex mt-4 px-4 py-2 rounded-full bg-[#176b2b] hover:bg-[#218739] text-white text-xs font-bold transition-colors"
        >
          {esRegistro ? 'Ver el impacto' : 'Ver el mapa'}
        </Link>
      </div>

      {impacto && (
        <motion.div
          initial={prefiereReducido ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: prefiereReducido ? 0 : 0.55 }}
          className="absolute -bottom-8 -right-6 xl:-right-10 rounded-2xl bg-white dark:bg-[#1a2320] text-gray-900 dark:text-[#f2f5f3] px-5 py-4 shadow-2xl border border-gray-100 dark:border-gray-800/40"
        >
          {esRegistro ? (
            <>
              <p className="text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae]">📍 Puntos activos</p>
              <p className="text-2xl font-black tabular-nums">{numero(impacto.puntos_activos)}</p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae]">♻️ Kilos reciclados</p>
              <p className="text-2xl font-black tabular-nums">
                {numero(impacto.kg_reciclados, 1)}
                <span className="text-sm font-bold text-gray-400 ml-1">kg</span>
              </p>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

function Mensajes({ mensajes }) {
  const prefiereReducido = useReducedMotion()
  const [indice, setIndice] = useState(0)

  // Rota cada 6 s (no si el usuario prefiere menos movimiento)
  useEffect(() => {
    if (prefiereReducido) return
    const intervalo = setInterval(
      () => setIndice((actual) => (actual + 1) % mensajes.length),
      6000
    )
    return () => clearInterval(intervalo)
  }, [prefiereReducido, mensajes.length])

  const mensaje = mensajes[indice]

  return (
    <>
      <div className="min-h-[7.5rem]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={mensaje.titulo}
            initial={prefiereReducido ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefiereReducido ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <h2 className="text-3xl xl:text-4xl font-black tracking-tight">
              {mensaje.titulo}
            </h2>
            <p className="text-sm text-white/80 mt-3 leading-relaxed">
              {mensaje.texto}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2 mt-6" role="group" aria-label="Mensajes">
        {mensajes.map((m, n) => (
          <button
            key={m.titulo}
            type="button"
            onClick={() => setIndice(n)}
            aria-label={`Ver mensaje ${n + 1}: ${m.titulo}`}
            aria-current={n === indice}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              n === indice ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </>
  )
}

function PanelFoto({ modo, impacto }) {
  const prefiereReducido = useReducedMotion()
  const contenido = CONTENIDO[modo]

  return (
    <div className="relative h-full flex flex-col justify-between overflow-hidden p-10 xl:p-12 text-white">
      {/* FOTOS: se funden una en otra al cambiar de modo */}
      <AnimatePresence initial={false}>
        <motion.img
          key={contenido.foto}
          src={contenido.foto}
          alt={contenido.altFoto}
          initial={prefiereReducido ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefiereReducido ? 0 : 0.8, ease: 'easeOut' }}
          className={`absolute inset-0 w-full h-full object-cover ${contenido.posicionFoto}`}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f14] via-[#0b1f14]/60 to-[#0f1512]/10" aria-hidden="true" />
      <div className="absolute inset-0 bg-[#176b2b]/20 mix-blend-multiply" aria-hidden="true" />

      {/* Espacio arriba: deja ver las cabinas del TransMiCable (solo login) */}
      {!contenido.tarjetaArriba && <div className="h-24 xl:h-32" aria-hidden="true" />}

      {/* TARJETAS FLOTANTES */}
      <div className={`relative flex justify-center ${contenido.tarjetaArriba ? 'pb-8' : 'py-8'}`}>
        <AnimatePresence mode="wait">
          <Tarjetas key={modo} modo={modo} impacto={impacto} />
        </AnimatePresence>
      </div>

      {contenido.tarjetaArriba && <div className="flex-1" aria-hidden="true" />}

      {/* MENSAJES QUE ROTAN */}
      <div className="relative text-center max-w-md mx-auto">
        <span className="inline-flex mb-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold">
          📍 Ciudad Bolívar, Bogotá
        </span>

        <Mensajes key={modo} mensajes={contenido.mensajes} />

        <p className="text-[10px] text-white/50 mt-6">
          Foto: Mussi Katz · Wikimedia Commons (CC0)
        </p>
      </div>
    </div>
  )
}

export default PanelFoto
