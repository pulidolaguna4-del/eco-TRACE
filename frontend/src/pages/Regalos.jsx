// =========================================================
// REGALOS: EXPLORAR (HU-25)
// =========================================================
// Lo que los vecinos están regalando: tarjetas con foto y un mapa con
// la zona aproximada de cada regalo. Filtros por categoría y búsqueda
// (sin tildes) en el navegador. El listado es público.

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { Buscador, EstadoVacio, FiltroChips, claseTarjeta } from '../components/admin/ui'
import { coincide } from '../components/admin/utilidades'
import { MapaZonas } from '../components/regalos/mapa'
import {
  claseBotonPrincipal,
  claseBotonSecundario,
  claseFondo,
  EncabezadoPagina,
  TarjetaRegalo
} from '../components/regalos/piezas'
import { useChat } from '../context/ChatContext'
import { api, CATEGORIAS_REGALO, categoriaRegalo, leerSesion } from '../utils/regalos'

const PASOS = [
  { icono: '📸', titulo: 'Publica', texto: 'Una foto, qué es y en qué barrio está.' },
  { icono: '💬', titulo: 'Conversen', texto: 'Quien lo quiere te escribe por el chat.' },
  { icono: '🤝', titulo: 'Entrega en mano', texto: 'Tú eliges a quién se lo das. Siempre gratis.' }
]

const VISTAS = [
  { id: 'lista', nombre: 'Lista', icono: '▦' },
  { id: 'mapa', nombre: 'Mapa', icono: '🗺️' }
]

function Regalos() {
  const navigate = useNavigate()
  const reducido = useReducedMotion()
  const { noLeidos } = useChat()
  const sesion = leerSesion()

  const [regalos, setRegalos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [vista, setVista] = useState('lista')

  useEffect(() => {
    const controlador = new AbortController()

    api('/regalos', { señal: controlador.signal })
      .then((datos) => setRegalos(datos))
      .catch((err) => err.name !== 'AbortError' && setError(err.message))
      .finally(() => !controlador.signal.aborted && setCargando(false))

    return () => controlador.abort()
  }, [])

  const porBusqueda = useMemo(
    () => regalos.filter((r) => coincide(`${r.titulo} ${r.descripcion ?? ''} ${r.barrio ?? ''} ${categoriaRegalo(r.categoria).nombre}`, busqueda)),
    [regalos, busqueda]
  )

  const visibles = categoria === 'todas' ? porBusqueda : porBusqueda.filter((r) => r.categoria === categoria)

  const opciones = [
    { id: 'todas', nombre: 'Todo', total: porBusqueda.length },
    ...CATEGORIAS_REGALO.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      icono: c.icono,
      total: porBusqueda.filter((r) => r.categoria === c.id).length
    })).filter((c) => c.total > 0 || c.id === categoria)
  ]

  const regalar = () => navigate(sesion ? '/regalos/nuevo' : '/login')
  const hayFiltros = categoria !== 'todas' || busqueda.trim()

  return (
    <div className={claseFondo}>
      <motion.main
        initial={reducido ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8"
      >
        <EncabezadoPagina
          etiqueta="Regalos · siempre gratis"
          titulo="Dale una segunda vida a lo que ya no usas"
          descripcion="Madera, muebles, ropa, cartón… Lo que a ti te sobra a un vecino de Ciudad Bolívar le puede servir. Primero reutilizar, después reciclar."
        >
          {sesion && (
            <>
              <Link to="/mis-regalos" className={claseBotonSecundario}>🎁 Mis regalos</Link>
              <Link to="/mensajes" className={`${claseBotonSecundario} relative`}>
                💬 Mensajes
                {noLeidos > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center tabular-nums">
                    {noLeidos}
                    <span className="sr-only"> sin leer</span>
                  </span>
                )}
              </Link>
            </>
          )}
          <button type="button" onClick={regalar} className={claseBotonPrincipal}>
            <span aria-hidden="true">＋</span> Regalar algo
          </button>
        </EncabezadoPagina>

        {/* CÓMO FUNCIONA */}
        <ol className="grid sm:grid-cols-3 gap-3">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className={`${claseTarjeta} p-4 flex items-center gap-3`}>
              <span className="w-11 h-11 shrink-0 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/10 dark:border-gray-800 flex items-center justify-center text-lg" aria-hidden="true">
                {paso.icono}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-gray-900 dark:text-white">
                  {i + 1}. {paso.titulo}
                </span>
                <span className="block text-xs text-gray-500 dark:text-[#a8b3ae]">{paso.texto}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* FILTROS */}
        <section className="space-y-4" aria-label="Filtros">
          <div className="flex flex-col sm:flex-row gap-3">
            <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre, barrio o descripción" etiqueta="Buscar regalos" />
            <FiltroChips opciones={VISTAS} valor={vista} onCambiar={setVista} etiqueta="Cómo ver los regalos" />
          </div>
          <FiltroChips opciones={opciones} valor={categoria} onCambiar={setCategoria} etiqueta="Filtrar por categoría" />
        </section>

        {/* RESULTADOS */}
        {error ? (
          <EstadoVacio icono="⚠️" titulo="No pudimos cargar los regalos" descripcion={error}>
            <button type="button" onClick={() => window.location.reload()} className={claseBotonSecundario}>Reintentar</button>
          </EstadoVacio>
        ) : cargando ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className={`${claseTarjeta} overflow-hidden animate-pulse`}>
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800/70" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-2/3 rounded-full bg-gray-100 dark:bg-gray-800/70" />
                  <div className="h-3 w-1/3 rounded-full bg-gray-100 dark:bg-gray-800/70" />
                </div>
              </div>
            ))}
          </div>
        ) : regalos.length === 0 ? (
          <EstadoVacio
            icono="🎁"
            titulo="Todavía no hay regalos disponibles"
            descripcion="Sé la primera persona en regalar algo que ya no uses. Alguien cerca lo puede aprovechar."
          >
            <button type="button" onClick={regalar} className={claseBotonPrincipal}>Regalar algo</button>
          </EstadoVacio>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            icono="🔎"
            titulo="No encontramos regalos con ese filtro"
            descripcion="Prueba con otra categoría u otra palabra. También puedes publicar lo que tú quieras regalar."
          >
            <div className="flex flex-wrap justify-center gap-2">
              {hayFiltros && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoria('todas')
                    setBusqueda('')
                  }}
                  className={claseBotonSecundario}
                >
                  Quitar filtros
                </button>
              )}
              <button type="button" onClick={regalar} className={claseBotonPrincipal}>Regalar algo</button>
            </div>
          </EstadoVacio>
        ) : vista === 'mapa' ? (
          <section className="space-y-2">
            <MapaZonas regalos={visibles} className="h-[65vh] min-h-[22rem]" />
            <p className="text-xs text-gray-500 dark:text-[#a8b3ae]">
              Cada círculo es una zona aproximada de unos 300 m. La dirección exacta se acuerda por el chat.
            </p>
          </section>
        ) : (
          <section aria-label="Regalos disponibles">
            <p className="sr-only" aria-live="polite">{visibles.length} regalos</p>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibles.map((regalo) => (
                <li key={regalo.id} className="flex">
                  <TarjetaRegalo regalo={regalo} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </motion.main>
    </div>
  )
}

export default Regalos
