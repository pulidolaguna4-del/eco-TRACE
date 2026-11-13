// =========================================================
// MIS REGALOS
// =========================================================
// Lo que publiqué, con su estado y cuántas personas lo pidieron.
// Cada tarjeta lleva al detalle, donde se reserva, entrega o renueva.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { claseTarjeta, EstadoVacio, Esqueleto, FiltroChips } from '../components/admin/ui'
import { formatearNumero } from '../components/admin/utilidades'
import {
  claseBotonPrincipal,
  claseBotonSecundario,
  claseFondo,
  EncabezadoPagina,
  TarjetaRegalo
} from '../components/regalos/piezas'
import { useChat } from '../context/ChatContext'
import { api, ESTADOS_REGALO, leerSesion } from '../utils/regalos'

function Indicador({ icono, etiqueta, valor, detalle }) {
  return (
    <div className={`${claseTarjeta} p-5`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">{etiqueta}</p>
        <span className="w-9 h-9 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/10 dark:border-gray-800 flex items-center justify-center" aria-hidden="true">{icono}</span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">{valor}</p>
      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">{detalle}</p>
    </div>
  )
}

function MisRegalos() {
  const reducido = useReducedMotion()
  const sesion = leerSesion()
  const { noLeidos } = useChat()

  const [regalos, setRegalos] = useState([])
  const [cargando, setCargando] = useState(Boolean(sesion))
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    if (!sesion) return
    api('/regalos/mios')
      .then(setRegalos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!sesion) {
    return (
      <div className={`${claseFondo} flex items-center justify-center p-4`}>
        <EstadoVacio icono="🔒" titulo="Inicia sesión para ver tus regalos" descripcion="Aquí verás lo que publicaste y quién lo pidió.">
          <Link to="/login" className={claseBotonPrincipal}>Iniciar sesión</Link>
        </EstadoVacio>
      </div>
    )
  }

  const contar = (estado) => regalos.filter((r) => r.estado === estado).length
  const entregados = regalos.filter((r) => r.estado === 'entregado')
  const kgRegalados = entregados.filter((r) => r.unidad === 'kg').reduce((s, r) => s + Number(r.cantidad), 0)
  const activos = contar('disponible') + contar('reservado')

  const opciones = [
    { id: 'todos', nombre: 'Todos', total: regalos.length },
    ...Object.entries(ESTADOS_REGALO)
      .map(([id, info]) => ({ id, nombre: info.nombre, total: contar(id) }))
      .filter((o) => o.total > 0 || o.id === filtro)
  ]

  const visibles = filtro === 'todos' ? regalos : regalos.filter((r) => r.estado === filtro)

  return (
    <div className={claseFondo}>
      <motion.main
        initial={reducido ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8"
      >
        <EncabezadoPagina
          etiqueta="Regalos"
          titulo="Mis regalos"
          descripcion="Lo que publicaste. Entra a cada uno para ver a los interesados, reservarlo y marcarlo como entregado."
        >
          <Link to="/mensajes" className={claseBotonSecundario}>
            💬 Mensajes
            {noLeidos > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-black flex items-center justify-center tabular-nums">
                {noLeidos}
                <span className="sr-only"> sin leer</span>
              </span>
            )}
          </Link>
          <Link to="/regalos/nuevo" className={claseBotonPrincipal}>
            <span aria-hidden="true">＋</span> Regalar algo
          </Link>
        </EncabezadoPagina>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Resumen">
          <Indicador icono="🟢" etiqueta="Publicados ahora" valor={cargando ? '…' : activos} detalle="Disponibles o reservados" />
          <Indicador icono="🤝" etiqueta="Entregados" valor={cargando ? '…' : entregados.length} detalle="Regalos que ya tienen nuevo dueño" />
          <Indicador icono="♻️" etiqueta="Kg reutilizados" valor={cargando ? '…' : `${formatearNumero(kgRegalados, 1)} kg`} detalle="De tus regalos entregados en kg" />
        </section>

        {error ? (
          <EstadoVacio icono="⚠️" titulo="No pudimos cargar tus regalos" descripcion={error} />
        ) : cargando ? (
          <Esqueleto filas={2} />
        ) : regalos.length === 0 ? (
          <EstadoVacio icono="🎁" titulo="Todavía no has regalado nada" descripcion="Publica algo que ya no uses: madera, muebles, ropa, cartón… Alguien cerca lo puede aprovechar.">
            <Link to="/regalos/nuevo" className={claseBotonPrincipal}>Regalar algo</Link>
          </EstadoVacio>
        ) : (
          <section className="space-y-5">
            <FiltroChips opciones={opciones} valor={filtro} onCambiar={setFiltro} etiqueta="Filtrar por estado" />
            {visibles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-[#a8b3ae]">No tienes regalos en este estado.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {visibles.map((regalo) => (
                  <li key={regalo.id} className="flex">
                    <TarjetaRegalo regalo={regalo} conEstado />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </motion.main>
    </div>
  )
}

export default MisRegalos
