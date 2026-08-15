import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents
} from 'react-leaflet'

import L from 'leaflet'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

import 'leaflet/dist/leaflet.css'

function SelectorUbicacion({ seleccionando, setUbicacion, limiteCiudadBolivar }) {
  useMapEvents({
    click(e) {
      if (!seleccionando) return
      if (!limiteCiudadBolivar) return

      const punto = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.latlng.lng, e.latlng.lat]
        },
        properties: {}
      }

      const dentroDeCiudadBolivar = booleanPointInPolygon(
        punto,
        limiteCiudadBolivar
      )

      if (!dentroDeCiudadBolivar) {
        alert(
          'La ubicación seleccionada está fuera de Ciudad Bolívar. Selecciona un punto dentro de la localidad.'
        )
        return
      }

      setUbicacion([e.latlng.lat, e.latlng.lng])
    }
  })

  return null
}

function obtenerIconoPorTipo(tipo) {
  const tipoNormalizado = tipo?.toLowerCase()

  let emoji = '📍'
  let color = '#218739'

  if (tipoNormalizado === 'reciclaje') {
    emoji = '♻️'
    color = '#218739'
  } else if (tipoNormalizado === 'ropa') {
    emoji = '👕'
    color = '#1976d2'
  } else if (
    tipoNormalizado === 'electrónicos' ||
    tipoNormalizado === 'electronicos'
  ) {
    emoji = '💻'
    color = '#7b1fa2'
  }

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: transform 0.2s;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  })
}

function Mapa() {
  const navigate = useNavigate()
  const centroCiudadBolivar = [4.575, -74.16]

  const [puntos, setPuntos] = useState([])
  const [limiteCiudadBolivar, setLimiteCiudadBolivar] = useState(null)
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Todos')
  const [seleccionando, setSeleccionando] = useState(false)
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    tipo: ''
  })

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const prefiereReducido = useReducedMotion()

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const respuestaPuntos = await fetch('http://127.0.0.1:8000/puntos')
        if (!respuestaPuntos.ok) {
          throw new Error('No se pudieron cargar los puntos')
        }
        const datosPuntos = await respuestaPuntos.json()

        const puntosCiudadBolivar = datosPuntos.filter(
          (punto) =>
            punto.localidad?.toUpperCase() === 'CIUDAD BOLIVAR' ||
            punto.localidad?.toUpperCase() === 'CIUDAD BOLÍVAR'
        )

        setPuntos(puntosCiudadBolivar)

        const respuestaGeoJSON = await fetch('/data/ciudadBolivar.geojson')
        if (respuestaGeoJSON.ok) {
          const datosGeoJSON = await respuestaGeoJSON.json()
          setLimiteCiudadBolivar(datosGeoJSON)
        }
      } catch (err) {
        console.error(err)
        setError('No se pudieron cargar los datos del mapa')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  const puntosFiltrados =
    tipoSeleccionado === 'Todos'
      ? puntos
      : puntos.filter(
          (punto) =>
            punto.tipo?.toLowerCase() === tipoSeleccionado.toLowerCase()
        )

  const estiloCiudadBolivar = {
    color: '#218739',
    weight: 3,
    fillColor: '#218739',
    fillOpacity: 0.12
  }

  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target
    setFormulario({
      ...formulario,
      [name]: value
    })
    setError('')
    setMensaje('')
  }

  const seleccionarTipoFormulario = (tipo) => {
    setFormulario((prev) => ({ ...prev, tipo }))
    setError('')
    setMensaje('')
  }

  const iniciarSeleccion = () => {
    setSeleccionando(true)
    setUbicacionSeleccionada(null)
    setMostrarFormulario(false)
    setMensaje('')
    setError('')
  }

  const cancelarSeleccion = () => {
    setSeleccionando(false)
    setUbicacionSeleccionada(null)
    setMostrarFormulario(false)
    setFormulario({
      nombre: '',
      descripcion: '',
      direccion: '',
      tipo: ''
    })
    setMensaje('')
    setError('')
  }

  const manejarUbicacion = (ubicacion) => {
    setUbicacionSeleccionada(ubicacion)
    setSeleccionando(false)
    setMostrarFormulario(true)
    setError('')
    setMensaje('')
  }

  const crearPunto = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    if (!ubicacionSeleccionada) {
      setError('Primero debes seleccionar una ubicación en el mapa')
      return
    }

    if (
      !formulario.nombre ||
      !formulario.descripcion ||
      !formulario.direccion ||
      !formulario.tipo
    ) {
      setError('Todos los campos son obligatorios')
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Debes iniciar sesión para crear un punto')
      return
    }

    const datosEnviar = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      direccion: formulario.direccion,
      localidad: 'Ciudad Bolívar',
      tipo: formulario.tipo,
      latitud: ubicacionSeleccionada[0],
      longitud: ubicacionSeleccionada[1]
    }

    try {
      setGuardando(true)

      const respuesta = await fetch('http://127.0.0.1:8000/puntos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosEnviar)
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.detail || 'No se pudo crear el punto')
        return
      }

      setMensaje('¡Punto creado correctamente! Quedó pendiente de aprobación.')
      setFormulario({
        nombre: '',
        descripcion: '',
        direccion: '',
        tipo: ''
      })
      setUbicacionSeleccionada(null)
      setMostrarFormulario(false)

      const respuestaPuntos = await fetch('http://127.0.0.1:8000/puntos')
      if (respuestaPuntos.ok) {
        const nuevosPuntos = await respuestaPuntos.json()
        const puntosCiudadBolivar = nuevosPuntos.filter(
          (punto) =>
            punto.localidad?.toUpperCase() === 'CIUDAD BOLIVAR' ||
            punto.localidad?.toUpperCase() === 'CIUDAD BOLÍVAR'
        )
        setPuntos(puntosCiudadBolivar)
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo conectar con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const categorias = [
    { id: 'Todos', nombre: 'Todos', icono: '📍' },
    { id: 'Reciclaje', nombre: 'Reciclaje', icono: '♻️' },
    { id: 'Ropa', nombre: 'Ropa', icono: '👕' },
    { id: 'Electrónicos', nombre: 'Electrónicos', icono: '💻' }
  ]

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER Y NAVEGACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.button
              type="button"
              whileHover={prefiereReducido ? {} : { scale: 1.02 }}
              whileTap={prefiereReducido ? {} : { scale: 0.98 }}
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2320] text-[#218739] dark:text-[#2fa350] border border-gray-100 dark:border-gray-800/40 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              ← Volver al inicio
            </motion.button>
            <h1 className="text-2xl sm:text-3xl font-black mt-3 bg-gradient-to-r from-[#218739] to-[#4caf68] dark:from-[#2fa350] dark:to-[#4caf68] bg-clip-text text-transparent">
              Mapa Interactivo de Puntos
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#a8b3ae] font-medium mt-1">
              Explora y registra lugares de reciclaje en Ciudad Bolívar
            </p>
          </div>

          {/* BOTÓN REGISTRAR PUNTO */}
          <div>
            {!seleccionando ? (
              <motion.button
                type="button"
                whileHover={prefiereReducido ? {} : { scale: 1.03 }}
                whileTap={prefiereReducido ? {} : { scale: 0.97 }}
                onClick={iniciarSeleccion}
                className="px-5 py-2.5 bg-gradient-to-r from-[#218739] to-[#39aa53] dark:from-[#2fa350] dark:to-[#39aa53] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>➕</span>
                <span>Agregar nuevo punto</span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={prefiereReducido ? {} : { scale: 1.03 }}
                whileTap={prefiereReducido ? {} : { scale: 0.97 }}
                onClick={cancelarSeleccion}
                className="px-5 py-2.5 bg-[#d93025] hover:bg-[#b3261e] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span>✕</span>
                <span>Cancelar selección</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* FILTROS INTERACTIVOS */}
        <div className="bg-white dark:bg-[#1a2320] p-4 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-[#a8b3ae] mr-2">
              Filtrar por:
            </span>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setTipoSeleccionado(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                  tipoSeleccionado === cat.id
                    ? 'bg-[#218739] dark:bg-[#2fa350] text-white shadow-xs'
                    : 'bg-gray-50 dark:bg-[#121816] text-gray-600 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800/40'
                }`}
              >
                <span>{cat.icono}</span>
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-500 dark:text-[#a8b3ae] bg-gray-50 dark:bg-[#121816] px-3 py-1.5 rounded-xl">
            Mostrando <strong>{puntosFiltrados.length}</strong> {puntosFiltrados.length === 1 ? 'punto' : 'puntos'}
          </div>
        </div>

        {/* MODO SELECCIÓN ACTIVO */}
        <AnimatePresence>
          {seleccionando && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs font-bold text-[#218739] dark:text-[#2fa350] flex items-center gap-3 shadow-2xs"
            >
              <span className="text-lg">📍</span>
              <span>
                Haz clic sobre la ubicación deseada dentro de Ciudad Bolívar en el mapa para marcar el nuevo punto ecológico.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UBICACIÓN SELECCIONADA */}
        <AnimatePresence>
          {ubicacionSeleccionada && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4 shadow-2xs"
            >
              <div>
                <span className="font-bold block text-sm">📍 Coordenadas marcadas</span>
                <span className="font-mono text-[11px] mt-0.5 block">
                  Lat: {ubicacionSeleccionada[0].toFixed(6)} | Lng: {ubicacionSeleccionada[1].toFixed(6)}
                </span>
              </div>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
              >
                Completar datos
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORMULARIO AGREGAR PUNTO */}
        <AnimatePresence>
          {mostrarFormulario && (
            <motion.div
              initial={{ opacity: 0, scale: prefiereReducido ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: prefiereReducido ? 1 : 0.96 }}
              className="bg-white dark:bg-[#1a2320] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xl transition-colors"
            >
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>➕</span> Registrar Nuevo Punto Ecológico
              </h2>

              <form onSubmit={crearPunto} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2">
                      Nombre del punto
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Ej: Punto de Reciclaje Comunitario"
                      value={formulario.nombre}
                      onChange={manejarCambioFormulario}
                      className="w-full px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2">
                      Dirección exacta
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      placeholder="Ej: Carrera 50 # 20-30"
                      value={formulario.direccion}
                      onChange={manejarCambioFormulario}
                      className="w-full px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2">
                    Descripción del lugar
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    placeholder="Detalla qué tipos de materiales o condiciones de entrega se aceptan"
                    value={formulario.descripcion}
                    onChange={manejarCambioFormulario}
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-[#0f1512] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350] transition-all"
                  />
                </div>

                {/* TARJETAS INTERACTIVAS DE CATEGORÍA */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2">
                    Categoría de residuo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'Reciclaje', nombre: 'Reciclaje Tradicional', icono: '♻️' },
                      { id: 'Ropa', nombre: 'Donación de Ropa', icono: '👕' },
                      { id: 'Electrónicos', nombre: 'Residuos Electrónicos', icono: '💻' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => seleccionarTipoFormulario(item.id)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center gap-3 ${
                          formulario.tipo === item.id
                            ? 'bg-[#218739]/10 dark:bg-[#2fa350]/20 border-[#218739] dark:border-[#2fa350] text-[#218739] dark:text-[#2fa350] font-bold shadow-2xs'
                            : 'bg-gray-50 dark:bg-[#0f1512] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        <span className="text-2xl">{item.icono}</span>
                        <span className="text-xs font-bold">{item.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* MENSAJES DE ERROR O ÉXITO */}
                {error && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] border border-red-100 dark:border-red-900/30 rounded-xl text-xs font-bold">
                    ⚠️ {error}
                  </div>
                )}

                {mensaje && (
                  <div className="p-3.5 bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border border-green-100 dark:border-green-900/30 rounded-xl text-xs font-bold">
                    🎉 {mensaje}
                  </div>
                )}

                {/* BOTÓN SUBMIT */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={guardando}
                    whileHover={prefiereReducido || guardando ? {} : { scale: 1.02 }}
                    whileTap={prefiereReducido || guardando ? {} : { scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-[#218739] to-[#39aa53] dark:from-[#2fa350] dark:to-[#39aa53] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-75 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {guardando ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Guardando punto...</span>
                      </>
                    ) : (
                      'Confirmar y enviar para revisión'
                    )}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-[#a8b3ae] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Ocultar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAPA INTERACTIVO */}
        <div className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm overflow-hidden h-[500px] sm:h-[600px] relative">
          {cargando && (
            <div className="absolute inset-0 z-20 bg-white/80 dark:bg-[#0f1512]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-[#218739]/30 border-t-[#218739] rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">Cargando capa interactiva...</p>
            </div>
          )}

          <MapContainer
            center={centroCiudadBolivar}
            zoom={13}
            minZoom={12}
            maxZoom={18}
            scrollWheelZoom={true}
            className="w-full h-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <SelectorUbicacion
              seleccionando={seleccionando}
              setUbicacion={manejarUbicacion}
              limiteCiudadBolivar={limiteCiudadBolivar}
            />

            {limiteCiudadBolivar && (
              <GeoJSON data={limiteCiudadBolivar} style={estiloCiudadBolivar} />
            )}

            {puntosFiltrados.map((punto) => (
              <Marker
                key={punto.id}
                position={[punto.latitud, punto.longitud]}
                icon={obtenerIconoPorTipo(punto.tipo)}
              >
                <Popup>
                  <div className="p-1 max-w-xs font-sans">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#f1f8f4] text-[#218739] mb-2">
                      {punto.tipo}
                    </span>
                    <h3 className="font-extrabold text-sm text-gray-900 mb-1">{punto.nombre}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{punto.descripcion}</p>
                    <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 space-y-1">
                      <div>📍 <strong>Dirección:</strong> {punto.direccion}</div>
                      <div>🏙️ <strong>Localidad:</strong> {punto.localidad}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {ubicacionSeleccionada && (
              <Marker position={ubicacionSeleccionada}>
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <strong className="text-[#218739] block mb-1">📍 Nueva ubicación marcada</strong>
                    <span>Completa los datos en el panel superior para enviarlo a moderación.</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}

export default Mapa
