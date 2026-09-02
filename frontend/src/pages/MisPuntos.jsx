import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { normalizarPunto } from '../utils/puntoUtils'
import { CategoriasBadges } from '../components/CategoriasBadges'

// =========================================================
// HOOK PERSONALIZADO: useCountUp
// =========================================================
function useCountUp(valorFinal, duracion = 1) {
  const [conteo, setConteo] = useState(0)
  const inicioRef = useRef(null)
  const prefiereReducido = useReducedMotion()

  useEffect(() => {
    if (prefiereReducido) {
      setConteo(valorFinal)
      return
    }

    let idAnimacion
    const inicio = conteo

    const animar = (marcaTiempo) => {
      if (!inicioRef.current) inicioRef.current = marcaTiempo
      const progreso = marcaTiempo - inicioRef.current
      const fraccion = Math.min(progreso / (duracion * 1000), 1)
      const easingOut = 1 - Math.pow(1 - fraccion, 2)
      const valorActual = Math.floor(inicio + (valorFinal - inicio) * easingOut)

      setConteo(valorActual)

      if (fraccion < 1) {
        idAnimacion = requestAnimationFrame(animar)
      }
    }

    idAnimacion = requestAnimationFrame(animar)
    return () => {
      cancelAnimationFrame(idAnimacion)
      inicioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorFinal, duracion, prefiereReducido])

  return conteo
}

// =========================================================
// COMPONENTE: Badge
// =========================================================
function Badge({ tipo, texto }) {
  const estilos = {
    pendiente: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
    aprobado: 'bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border-green-200 dark:border-green-900/30',
    rechazado: 'bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] border-red-200 dark:border-red-900/30',
    info: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
  }

  const iconos = {
    pendiente: '⏳',
    aprobado: '✓',
    rechazado: '✕',
    info: 'ℹ️'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${estilos[tipo] || estilos.info}`}>
      <span>{iconos[tipo]}</span>
      <span>{texto}</span>
    </span>
  )
}

// =========================================================
// COMPONENTE: EmptyState
// =========================================================
function EmptyState({ titulo, descripcion, icono = '🌱', accionTexto, onAccion }) {
  return (
    <div className="py-16 text-center">
      <span className="text-4xl block mb-3">{icono}</span>
      <h4 className="text-lg font-bold text-gray-800 dark:text-[#f2f5f3]">{titulo}</h4>
      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 max-w-sm mx-auto px-4 mb-6">{descripcion}</p>
      {accionTexto && onAccion && (
        <button
          onClick={onAccion}
          className="px-5 py-2.5 bg-[#218739] dark:bg-[#2fa350] hover:bg-[#176b2b] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          {accionTexto}
        </button>
      )}
    </div>
  )
}

function MisPuntos() {
  const navigate = useNavigate()
  const prefiereReducido = useReducedMotion()

  const [misPuntos, setMisPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (!token) {
      setError('Debes iniciar sesión para ver tu historial de puntos ecológicos')
      setCargando(false)
      return
    }

    if (usuarioGuardado) {
      try {
        setUsuario(JSON.parse(usuarioGuardado))
      } catch (err) {
        console.error(err)
      }
    }

    const cargarMisPuntos = async () => {
      try {
        setCargando(true)
        setError('')

        const respuesta = await fetch('http://127.0.0.1:8000/puntos/mis-puntos', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!respuesta.ok) {
          throw new Error('No se pudieron obtener tus puntos registrados')
        }

        const datos = await respuesta.json()
        const puntosNormalizados = datos.map(normalizarPunto)
        setMisPuntos(puntosNormalizados)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setCargando(false)
      }
    }

    cargarMisPuntos()
  }, [])

  // Métricas calculadas
  const puntosPendientes = misPuntos.filter((p) => p.estado === 'pendiente')
  const puntosAprobados = misPuntos.filter((p) => p.estado === 'aprobado')
  const puntosRechazados = misPuntos.filter((p) => p.estado === 'rechazado')

  const totalVal = useCountUp(misPuntos.length)
  const pendientesVal = useCountUp(puntosPendientes.length)
  const aprobadosVal = useCountUp(puntosAprobados.length)
  const rechazadosVal = useCountUp(puntosRechazados.length)

  const contenedorVariantes = {
    oculto: {},
    visible: { transition: { staggerChildren: prefiereReducido ? 0 : 0.08 } }
  }

  const elementoVariantes = {
    oculto: { opacity: 0, y: prefiereReducido ? 0 : 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  }

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] font-sans transition-colors duration-300 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ENCABEZADO DE BIENVENIDA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
              Hola, {usuario?.nombre || 'Ciudadano'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] font-medium mt-1">
              Aquí puedes revisar el estado de los puntos ecológicos que has compartido con tu comunidad.
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
              <span>➕</span>
              <span>Registrar nuevo punto</span>
            </motion.button>
          </div>
        </div>

        {/* TARJETAS DE RESUMEN DE APORTES */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Mis Aportes</span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-[#218739] dark:text-[#2fa350] text-sm">🌱</span>
            </div>
            <div className="mt-3 text-3xl font-black text-gray-900 dark:text-white">
              {cargando ? '...' : totalVal}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-semibold">Total registrados</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Pendientes</span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-sm">⏳</span>
            </div>
            <div className="mt-3 text-3xl font-black text-amber-500 dark:text-amber-400">
              {cargando ? '...' : pendientesVal}
            </div>
            <p className="text-[11px] text-amber-600/80 font-bold mt-1">En proceso de revisión</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Aprobados</span>
              <span className="p-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] text-sm">✓</span>
            </div>
            <div className="mt-3 text-3xl font-black text-[#218739] dark:text-[#2fa350]">
              {cargando ? '...' : aprobadosVal}
            </div>
            <p className="text-[11px] text-green-600/80 font-bold mt-1">Activos en el mapa</p>
          </div>

          <div className="bg-white dark:bg-[#1a2320] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-[#a8b3ae] uppercase">
              <span>Rechazados</span>
              <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] text-sm">✕</span>
            </div>
            <div className="mt-3 text-3xl font-black text-[#d93025] dark:text-[#ef5350]">
              {cargando ? '...' : rechazadosVal}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 font-semibold">Requieren ajustes</p>
          </div>
        </section>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border-l-4 border-[#d93025] text-xs font-bold text-[#d93025] dark:text-[#ef5350] rounded-r-xl">
            ⚠️ {error}
          </div>
        )}

        {/* LISTA / HISTORIAL DE PUNTOS DEL USUARIO */}
        <section className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/40 flex items-center justify-between bg-gray-50/30 dark:bg-[#121816]/30">
            <div>
              <h3 className="text-base font-extrabold text-gray-800 dark:text-[#f2f5f3]">
                Mis Puntos Registrados
              </h3>
              <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                Historial completo de tus registros ecológicos comunitarios.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-[#a8b3ae] bg-gray-100 dark:bg-[#0f1512] px-3 py-1 rounded-full">
              {misPuntos.length} en total
            </span>
          </div>

          {cargando ? (
            /* SKELETONS DE CARGA */
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
          ) : misPuntos.length === 0 ? (
            <EmptyState
              titulo="Aún no has registrado ningún punto"
              descripcion="¡Sé el primero en aportar un punto ecológico en tu zona para ayudar a tus vecinos y al medio ambiente!"
              icono="🍃"
              accionTexto="Registrar mi primer punto"
              onAccion={() => navigate('/mapa')}
            />
          ) : (
            <motion.div
              variants={contenedorVariantes}
              initial="oculto"
              animate="visible"
              className="divide-y divide-gray-100 dark:divide-gray-800/40"
            >
              {misPuntos.map((punto) => (
                <motion.div
                  key={punto.id}
                  variants={elementoVariantes}
                  className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-extrabold text-gray-900 dark:text-[#f2f5f3] text-sm sm:text-base">
                        {punto.nombre}
                      </h4>
                      <Badge
                        tipo={
                          punto.estado === 'aprobado'
                            ? 'aprobado'
                            : punto.estado === 'rechazado'
                            ? 'rechazado'
                            : 'pendiente'
                        }
                        texto={punto.estado}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#a8b3ae] line-clamp-2">
                      {punto.descripcion}
                    </p>
                    <div className="text-[11px] text-gray-400 font-medium flex items-center gap-4 flex-wrap pt-1">
                      <span>📍 <strong>Dirección:</strong> {punto.direccion}</span>
                      <span>🏙️ <strong>Localidad:</strong> {punto.localidad}</span>
                      <div className="flex items-center gap-1">
                        <span>🏷️ <strong>Categorías:</strong></span>
                        <CategoriasBadges categorias={punto.categorias} />
                      </div>
                    </div>
                  </div>

                  {punto.estado === 'aprobado' && (
                    <button
                      onClick={() => navigate('/mapa')}
                      className="self-start sm:self-center px-3.5 py-1.5 bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border border-green-200 dark:border-green-900/30 rounded-xl text-xs font-bold cursor-pointer hover:bg-green-100 transition-colors"
                    >
                      Ver en el mapa
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}

export default MisPuntos
