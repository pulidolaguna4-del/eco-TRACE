import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

// =========================================================
// COMPONENTE: TextoAnimado
// =========================================================
function TextoAnimado({ texto }) {
  const prefiereReducido = useReducedMotion()

  if (prefiereReducido) {
    return <span>{texto}</span>
  }

  const letras = Array.from(texto)

  const contenedorVariantes = {
    oculto: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.02, delayChildren: 0.1 }
    }
  }

  const letraVariantes = {
    oculto: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 120, damping: 12 }
    }
  }

  return (
    <motion.span
      variants={contenedorVariantes}
      initial="oculto"
      animate="visible"
      className="inline-block"
    >
      {letras.map((letra, indice) => (
        <motion.span
          key={indice}
          variants={letraVariantes}
          className="inline-block whitespace-pre"
        >
          {letra}
        </motion.span>
      ))}
    </motion.span>
  )
}

function Home() {
  const navigate = useNavigate()

  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)

  const prefiereReducido = useReducedMotion()

  useEffect(() => {
    // Comprobar estado de sesión del usuario
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      try {
        const datosUsuario = JSON.parse(usuarioGuardado)
        setUsuario(datosUsuario)
        setEsAdmin(datosUsuario.es_admin === true)
      } catch (err) {
        console.error('Error al leer datos del usuario:', err)
      }
    }

    // Cargar puntos ecológicos reales
    const cargarPuntos = async () => {
      try {
        const respuesta = await fetch('http://127.0.0.1:8000/puntos')
        if (!respuesta.ok) {
          throw new Error('No se pudieron obtener los puntos ecológicos')
        }
        const datos = await respuesta.json()
        setPuntos(datos)
      } catch (err) {
        console.error(err)
        setError('No se pudieron cargar los datos actualizados')
      } finally {
        setCargando(false)
      }
    }

    cargarPuntos()
  }, [])

  const contenedorVariantes = {
    oculto: {},
    visible: {
      transition: {
        staggerChildren: prefiereReducido ? 0 : 0.08,
        delayChildren: prefiereReducido ? 0 : 0.3
      }
    }
  }

  const elementoVariantes = {
    oculto: { opacity: 0, y: prefiereReducido ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 90, damping: 15 }
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] font-sans text-[#333333] dark:text-[#f2f5f3] transition-colors duration-300">

      {/* HERO CONCEPTUAL: EL TRAZO VERDE DE LA CIUDAD */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f1f8f4] to-[#f1f8f4] dark:from-[#1a2320] dark:via-[#0f1512] dark:to-[#0f1512] pt-16 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-300">

        {/* ELEMENTO DISTINTIVO: LÍNEAS DE TRAZO INTERACTIVAS Y LUZ ORGÁNICA */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#218739]/10 dark:bg-[#2fa350]/10 rounded-full blur-3xl"></div>
          <svg className="absolute w-full h-full stroke-[#218739]/15 dark:stroke-[#2fa350]/15" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M-100 100 Q 200 300 500 150 T 1200 400" strokeWidth="2" strokeDasharray="6 6" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">

          {/* MARCA DE COORDENADAS: refuerza la idea de "trazar" un punto real en la ciudad */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-4 uppercase"
          >
            Bogotá · Ciudad Bolívar · Red comunitaria activa
          </motion.p>

          {/* BADGE ELEMENTO DISTINTIVO: SELLO DE VERIFICACIÓN */}
          <motion.div
            initial={{ opacity: 0, scale: prefiereReducido ? 1 : 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#121816] text-[#218739] dark:text-[#2fa350] border border-[#218739]/20 dark:border-gray-800 text-xs font-extrabold mb-6 shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#218739] dark:bg-[#2fa350] animate-ping"></span>
            <span>Verificación comunitaria activa</span>
          </motion.div>

          {/* TÍTULO PRINCIPAL CON TEXTO ANIMADO */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight">
            <TextoAnimado texto="Cada punto ecológico, " />
            <span className="bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
              trazado y verificado
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: prefiereReducido ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-base sm:text-xl text-gray-600 dark:text-[#a8b3ae] max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
          >
            eco-TRACE es el registro comunitario de lugares de reciclaje, donación de ropa y residuos electrónicos en tu ciudad. Nadie publica un punto sin que alguien más lo confirme primero.
          </motion.p>

          {/* ACCIONES DINÁMICAS (CONDICIONADAS A AUTENTICACIÓN - FASE 5/6) */}
          <motion.div
            initial={{ opacity: 0, y: prefiereReducido ? 0 : 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <motion.button
              whileHover={prefiereReducido ? {} : { scale: 1.03 }}
              whileTap={prefiereReducido ? {} : { scale: 0.97 }}
              onClick={() => navigate('/mapa')}
              className="px-8 py-3.5 bg-[#218739] dark:bg-[#2fa350] hover:bg-[#176b2b] dark:hover:bg-[#218739] text-white text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🗺️</span>
              <span>Explorar el Mapa</span>
            </motion.button>

            {usuario ? (
              <motion.button
                whileHover={prefiereReducido ? {} : { scale: 1.03 }}
                whileTap={prefiereReducido ? {} : { scale: 0.97 }}
                onClick={() => navigate('/mis-puntos')}
                className="px-8 py-3.5 bg-white dark:bg-[#1a2320] text-gray-800 dark:text-[#f2f5f3] border border-gray-200 dark:border-gray-800 text-sm font-bold rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>🌱</span>
                <span>Ir a Mi Panel</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={prefiereReducido ? {} : { scale: 1.03 }}
                whileTap={prefiereReducido ? {} : { scale: 0.97 }}
                onClick={() => navigate('/register')}
                className="px-8 py-3.5 bg-white dark:bg-[#1a2320] text-gray-800 dark:text-[#f2f5f3] border border-gray-200 dark:border-gray-800 text-sm font-bold rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>👤</span>
                <span>Únete a la Comunidad</span>
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN MANIFIESTO: EL FACTOR DIFERENCIAL DE VERIFICACIÓN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
        <div className="bg-white dark:bg-[#1a2320] rounded-3xl p-8 sm:p-12 border border-gray-100 dark:border-gray-800/40 shadow-xs relative overflow-hidden transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
            <div className="md:col-span-2 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#218739] dark:text-[#2fa350]">
                Por qué confiar
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                La verificación no es un detalle, es el producto.
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] leading-relaxed">
                En eco-TRACE ningún punto llega solo al mapa: cada coordenada enviada por la comunidad pasa primero por nuestro Panel de Moderación. Si aparece ahí, es porque alguien más ya lo confirmó.
              </p>
            </div>

            <div className="bg-[#f1f8f4] dark:bg-[#121816] p-6 rounded-2xl border border-[#218739]/20 text-center space-y-2">
              <span className="text-4xl block">🛡️</span>
              <div className="text-2xl font-black text-[#218739] dark:text-[#2fa350]">100% Verificado</div>
              <p className="text-[11px] text-gray-500 dark:text-[#a8b3ae] font-semibold">
                Revisado por moderadores antes de publicarse
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVIDENCIA DE ACTIVIDAD REAL Y ESTADÍSTICAS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            El mapa, en cifras
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] mt-1">
            Datos reales de la red, actualizados con cada verificación.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 text-center shadow-2xs">
            <span className="text-3xl block mb-2">♻️</span>
            <div className="text-3xl font-black text-[#218739] dark:text-[#2fa350]">
              {cargando ? '...' : puntos.length}
            </div>
            <div className="text-xs font-bold text-gray-800 dark:text-[#f2f5f3] mt-1">Puntos Verificados</div>
            <p className="text-[11px] text-gray-400 mt-1">Visibles y disponibles en el mapa interactivo</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 text-center shadow-2xs">
            <span className="text-3xl block mb-2">👕</span>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">3+</div>
            <div className="text-xs font-bold text-gray-800 dark:text-[#f2f5f3] mt-1">Categorías Verificadas</div>
            <p className="text-[11px] text-gray-400 mt-1">Reciclaje tradicional, ropa y electrónicos</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 text-center shadow-2xs">
            <span className="text-3xl block mb-2">📍</span>
            <div className="text-3xl font-black text-amber-500 dark:text-amber-400">Ciudad Bolívar</div>
            <div className="text-xs font-bold text-gray-800 dark:text-[#f2f5f3] mt-1">Cobertura Inicial</div>
            <p className="text-[11px] text-gray-400 mt-1">Expandiéndonos progresivamente</p>
          </div>
        </div>
      </section>

      {/* MÓDULO ADMINISTRADOR CONDICIONAL (SI ES ADMIN) */}
      {esAdmin && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-2xs">
            <div className="flex gap-4 items-start">
              <span className="text-3xl p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl shrink-0">🛡️</span>
              <div>
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400">Panel de Moderación</h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 max-w-xl">
                  Tienes permisos de administrador. Revisa las solicitudes de la comunidad y mantén el mapa al día.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="shrink-0 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Ir a Moderación
            </button>
          </div>
        </section>
      )}

      {/* MUESTRA DESTACADA DE PUNTOS REALES VERIFICADOS */}
      <section className="bg-white dark:bg-[#121816] py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-850 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Puntos verificados en tu ciudad
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] mt-1">
              Lugares reales, confirmados por la comunidad, listos para recibir tus residuos hoy.
            </p>
          </div>

          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-gray-50 dark:bg-[#1a2320] p-6 rounded-2xl space-y-3 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-[#d93025] border border-red-100 text-center rounded-xl text-xs font-bold">
              {error}
            </div>
          ) : puntos.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400 font-semibold">
              🍃 Aún no hay puntos verificados por aquí. Sé el primero en trazar uno.
            </div>
          ) : (
            <motion.div
              variants={contenedorVariantes}
              initial="oculto"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {puntos.map((punto) => (
                <motion.div
                  key={punto.id}
                  variants={elementoVariantes}
                  whileHover={prefiereReducido ? {} : { y: -4, scale: 1.01 }}
                  className="bg-gray-50 dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/40 p-6 rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">
                        {punto.tipo.toLowerCase().includes('electr') ? '🔌' : punto.tipo.toLowerCase().includes('ropa') ? '👕' : '♻️'}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-[#218739]/10 text-[#218739] dark:text-[#2fa350]">
                        {punto.tipo}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-[#f2f5f3] mb-1">
                      {punto.nombre}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-[#a8b3ae] line-clamp-2 leading-relaxed mb-4">
                      {punto.descripcion}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200/60 dark:border-gray-800/40 text-[11px] text-gray-600 dark:text-[#a8b3ae] space-y-1 font-medium">
                    <div>📍 {punto.direccion}</div>
                    <div>🏙️ {punto.localidad}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
export { TextoAnimado }
