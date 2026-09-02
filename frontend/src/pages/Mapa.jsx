import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMapEvents,
  useMap
} from 'react-leaflet'

import L from 'leaflet'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

import 'leaflet/dist/leaflet.css'

import {
  normalizarPunto,
  CATEGORIAS_DISPONIBLES,
  obtenerIconoYColorPorCategorias
} from '../utils/puntoUtils'
import { CategoriasBadges } from '../components/CategoriasBadges'


// =========================================================
// SELECTOR DE UBICACIÓN PARA CREAR PUNTOS
// =========================================================

function SelectorUbicacion({
  seleccionando,
  setUbicacion,
  limiteCiudadBolivar
}) {
  useMapEvents({
    click(e) {
      if (!seleccionando) return
      if (!limiteCiudadBolivar) return

      const punto = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            e.latlng.lng,
            e.latlng.lat
          ]
        },
        properties: {}
      }

      const dentroDeCiudadBolivar =
        booleanPointInPolygon(
          punto,
          limiteCiudadBolivar
        )

      if (!dentroDeCiudadBolivar) {
        alert(
          'La ubicación seleccionada está fuera de Ciudad Bolívar. Selecciona un punto dentro de la localidad.'
        )
        return
      }

      setUbicacion([
        e.latlng.lat,
        e.latlng.lng
      ])
    }
  })

  return null
}


// =========================================================
// CAMBIAR CENTRO DEL MAPA
// =========================================================

function ControlVistaMapa({ ubicacion }) {
  const map = useMap()

  useEffect(() => {
    if (!ubicacion) return

    map.flyTo(
      ubicacion,
      15,
      {
        duration: 1
      }
    )
  }, [ubicacion, map])

  return null
}


// =========================================================
// ICONOS DE LOS PUNTOS
// =========================================================

function obtenerIconoPorCategorias(categorias = []) {
  const { emoji, color } = obtenerIconoYColorPorCategorias(categorias)

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


// =========================================================
// ICONO DE UBICACIÓN DEL USUARIO
// =========================================================

const iconoUsuario = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #1976d2;
      border: 4px solid white;
      box-shadow: 0 0 0 5px rgba(25,118,210,0.25),
                  0 4px 12px rgba(0,0,0,0.30);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
})


// =========================================================
// MAPA
// =========================================================

function Mapa() {
  const navigate = useNavigate()

  const centroCiudadBolivar = [4.575, -74.16]

  // =======================================================
  // DATOS
  // =======================================================

  const [puntos, setPuntos] = useState([])

  const [limiteCiudadBolivar, setLimiteCiudadBolivar] = useState(null)

  // Filtros de categorías seleccionadas (arreglo)
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([])

  const [seleccionando, setSeleccionando] = useState(false)

  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)


  // =======================================================
  // ENTREGA
  // =======================================================

  const [puntoEntrega, setPuntoEntrega] = useState(null)

  const [mostrarEntrega, setMostrarEntrega] = useState(false)

  const [formularioEntrega, setFormularioEntrega] = useState({
    tipo: 'reciclaje',
    cantidad: '',
    unidad: 'kg'
  })

  const [mensajeEntrega, setMensajeEntrega] = useState('')

  const [errorEntrega, setErrorEntrega] = useState('')

  const [guardandoEntrega, setGuardandoEntrega] = useState(false)


  // =======================================================
  // FORMULARIO PUNTO
  // =======================================================

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    categorias: []
  })

  const [mensaje, setMensaje] = useState('')

  const [error, setError] = useState('')

  const [cargando, setCargando] = useState(true)

  const [guardando, setGuardando] = useState(false)


  // =======================================================
  // CAPAS DEL MAPA
  // =======================================================

  const [tipoMapa, setTipoMapa] = useState('normal')

  const [mostrarCapas, setMostrarCapas] = useState(false)


  // =======================================================
  // UBICACIÓN DEL USUARIO
  // =======================================================

  const [ubicacionUsuario, setUbicacionUsuario] = useState(null)

  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)


  // =======================================================
  // RUTA
  // =======================================================

  const [ruta, setRuta] = useState(null)

  const [cargandoRuta, setCargandoRuta] = useState(false)

  const [puntoRuta, setPuntoRuta] = useState(null)

  const [errorRuta, setErrorRuta] = useState('')


  const prefiereReducido = useReducedMotion()


  // =======================================================
  // CONFIGURACIÓN DE CAPAS
  // =======================================================

  const capasMapa = {
    normal: {
      nombre: 'Mapa normal',
      icono: '🗺️',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    },
    satelite: {
      nombre: 'Satélite',
      icono: '🛰️',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri'
    },
    relieve: {
      nombre: 'Relieve',
      icono: '⛰️',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap'
    },
    oscuro: {
      nombre: 'Mapa oscuro',
      icono: '🌙',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  }


  // =======================================================
  // CARGAR PUNTOS Y GEOJSON
  // =======================================================

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const respuestaPuntos = await fetch('http://127.0.0.1:8000/puntos')

        if (!respuestaPuntos.ok) {
          throw new Error('No se pudieron cargar los puntos')
        }

        const datosPuntos = await respuestaPuntos.json()

        const puntosNormalizados = datosPuntos.map(normalizarPunto)

        const puntosCiudadBolivar = puntosNormalizados.filter(
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


  // =======================================================
  // FILTRAR PUNTOS
  // =======================================================

  const toggleFiltroCategoria = (catId) => {
    if (catId === 'Todos') {
      setCategoriasSeleccionadas([])
      return
    }

    setCategoriasSeleccionadas((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    )
  }

  const puntosFiltrados =
    categoriasSeleccionadas.length === 0
      ? puntos
      : puntos.filter((punto) =>
          punto.categorias.some((catPunto) =>
            categoriasSeleccionadas.some(
              (catFiltro) => catFiltro.toLowerCase() === catPunto.toLowerCase()
            )
          )
        )


  // =======================================================
  // ESTILO CIUDAD BOLÍVAR
  // =======================================================

  const estiloCiudadBolivar = {
    color: '#218739',
    weight: 3,
    fillColor: '#218739',
    fillOpacity: 0.12
  }


  // =======================================================
  // OBTENER UBICACIÓN DEL USUARIO
  // =======================================================

  const obtenerUbicacionUsuario = () => {
    setErrorRuta('')
    setObteniendoUbicacion(true)

    if (!navigator.geolocation) {
      setErrorRuta('Tu navegador no permite obtener tu ubicación.')
      setObteniendoUbicacion(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const ubicacion = [
          posicion.coords.latitude,
          posicion.coords.longitude
        ]
        setUbicacionUsuario(ubicacion)
        setObteniendoUbicacion(false)
      },
      (err) => {
        console.error(err)
        setErrorRuta(
          'No se pudo obtener tu ubicación. Activa el GPS o permite el acceso a la ubicación.'
        )
        setObteniendoUbicacion(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }


  // =======================================================
  // CALCULAR RUTA MÁS RÁPIDA
  // =======================================================

  const calcularRuta = async (punto) => {
    setErrorRuta('')

    if (!navigator.geolocation) {
      setErrorRuta('Tu navegador no permite obtener tu ubicación.')
      return
    }

    setPuntoRuta(punto)
    setCargandoRuta(true)

    navigator.geolocation.getCurrentPosition(
      async (posicion) => {
        try {
          const origen = [
            posicion.coords.longitude,
            posicion.coords.latitude
          ]

          const destino = [punto.longitud, punto.latitud]

          setUbicacionUsuario([
            posicion.coords.latitude,
            posicion.coords.longitude
          ])

          const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${origen[0]},${origen[1]};` +
            `${destino[0]},${destino[1]}` +
            `?overview=full&geometries=geojson&steps=true`

          const respuesta = await fetch(url)

          if (!respuesta.ok) {
            throw new Error('No se pudo calcular la ruta')
          }

          const datos = await respuesta.json()

          if (!datos.routes || datos.routes.length === 0) {
            throw new Error('No se encontró una ruta')
          }

          const rutaPrincipal = datos.routes[0]

          setRuta({
            coordinates: rutaPrincipal.geometry.coordinates,
            distancia: rutaPrincipal.distance,
            duracion: rutaPrincipal.duration
          })
        } catch (err) {
          console.error(err)
          setErrorRuta('No se pudo calcular la ruta hasta este punto.')
          setRuta(null)
        } finally {
          setCargandoRuta(false)
        }
      },
      (err) => {
        console.error(err)
        setErrorRuta(
          'No se pudo obtener tu ubicación. Activa el GPS o permite el acceso a la ubicación.'
        )
        setCargandoRuta(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }


  // =======================================================
  // LIMPIAR RUTA
  // =======================================================

  const limpiarRuta = () => {
    setRuta(null)
    setPuntoRuta(null)
    setErrorRuta('')
  }


  // =======================================================
  // FORMATEAR DISTANCIA / TIEMPO
  // =======================================================

  const formatearDistancia = (metros) => {
    if (metros < 1000) {
      return `${Math.round(metros)} m`
    }
    return `${(metros / 1000).toFixed(1)} km`
  }

  const formatearDuracion = (segundos) => {
    const minutos = Math.round(segundos / 60)
    if (minutos < 60) {
      return `${minutos} min`
    }
    const horas = Math.floor(minutos / 60)
    const minutosRestantes = minutos % 60
    if (minutosRestantes === 0) {
      return `${horas} h`
    }
    return `${horas} h ${minutosRestantes} min`
  }


  // =======================================================
  // FORMULARIO NUEVO PUNTO
  // =======================================================

  const manejarCambioFormulario = (e) => {
    const { name, value } = e.target
    setFormulario({
      ...formulario,
      [name]: value
    })
    setError('')
    setMensaje('')
  }

  const toggleCategoriaFormulario = (catId) => {
    setFormulario((prev) => {
      const yaSeleccionada = prev.categorias.includes(catId)
      const nuevasCategorias = yaSeleccionada
        ? prev.categorias.filter((c) => c !== catId)
        : [...prev.categorias, catId]

      return {
        ...prev,
        categorias: nuevasCategorias
      }
    })
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
      categorias: []
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


  // =======================================================
  // CREAR PUNTO
  // =======================================================

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
      !formulario.direccion
    ) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (!formulario.categorias || formulario.categorias.length === 0) {
      setError('Debes seleccionar al menos una categoría')
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
      categorias: formulario.categorias,
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
        categorias: []
      })

      setUbicacionSeleccionada(null)
      setMostrarFormulario(false)

      const respuestaPuntos = await fetch('http://127.0.0.1:8000/puntos')

      if (respuestaPuntos.ok) {
        const nuevosPuntos = await respuestaPuntos.json()
        const puntosNormalizados = nuevosPuntos.map(normalizarPunto)

        const puntosCiudadBolivar = puntosNormalizados.filter(
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


  // =======================================================
  // ABRIR FORMULARIO DE ENTREGA
  // =======================================================

  const abrirFormularioEntrega = (punto) => {
    setPuntoEntrega(punto)
    setMostrarEntrega(true)

    const primerTipo = punto.categorias?.[0] || 'reciclaje'

    setFormularioEntrega({
      tipo:
        primerTipo.toLowerCase().includes('ropa')
          ? 'ropa'
          : primerTipo.toLowerCase().includes('electr')
          ? 'electronicos'
          : 'reciclaje',
      cantidad: '',
      unidad: primerTipo.toLowerCase().includes('ropa') ? 'prendas' : 'kg'
    })

    setMensajeEntrega('')
    setErrorEntrega('')
  }


  // =======================================================
  // CERRAR ENTREGA
  // =======================================================

  const cerrarFormularioEntrega = () => {
    setMostrarEntrega(false)
    setPuntoEntrega(null)
    setFormularioEntrega({
      tipo: 'reciclaje',
      cantidad: '',
      unidad: 'kg'
    })
    setMensajeEntrega('')
    setErrorEntrega('')
  }


  // =======================================================
  // CAMBIO ENTREGA
  // =======================================================

  const manejarCambioEntrega = (e) => {
    const { name, value } = e.target
    setFormularioEntrega((prev) => ({
      ...prev,
      [name]: value
    }))
    setErrorEntrega('')
    setMensajeEntrega('')
  }


  // =======================================================
  // REGISTRAR ENTREGA
  // =======================================================

  const registrarEntrega = async (e) => {
    e.preventDefault()

    setErrorEntrega('')
    setMensajeEntrega('')

    if (!puntoEntrega) {
      setErrorEntrega('No se seleccionó ningún punto')
      return
    }

    if (!formularioEntrega.cantidad) {
      setErrorEntrega('Ingresa la cantidad entregada')
      return
    }

    if (Number(formularioEntrega.cantidad) <= 0) {
      setErrorEntrega('La cantidad debe ser mayor que 0')
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      setErrorEntrega('Debes iniciar sesión para registrar una entrega')
      return
    }

    const datosEnviar = {
      punto_id: puntoEntrega.id,
      tipo: formularioEntrega.tipo,
      cantidad: Number(formularioEntrega.cantidad),
      unidad: formularioEntrega.unidad
    }

    try {
      setGuardandoEntrega(true)

      const respuesta = await fetch('http://127.0.0.1:8000/entregas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosEnviar)
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorEntrega(datos.detail || 'No se pudo registrar la entrega')
        return
      }

      setMensajeEntrega(
        '¡Entrega registrada correctamente! Puedes verla en tu historial.'
      )

      setFormularioEntrega({
        tipo: formularioEntrega.tipo,
        cantidad: '',
        unidad: formularioEntrega.unidad
      })
    } catch (err) {
      console.error(err)
      setErrorEntrega('No se pudo conectar con el servidor')
    } finally {
      setGuardandoEntrega(false)
    }
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] text-[#333333] dark:text-[#f2f5f3] p-4 sm:p-6 lg:p-8 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

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

          {/* BOTÓN REGISTRAR */}

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


        {/* =================================================
            FILTROS DE SELECCIÓN MÚLTIPLE
        ================================================= */}

        <div className="bg-white dark:bg-[#1a2320] p-4 rounded-2xl border border-gray-100 dark:border-gray-800/40 shadow-2xs flex flex-wrap items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-[#a8b3ae] mr-2">
              Filtrar por:
            </span>

            <button
              type="button"
              onClick={() => toggleFiltroCategoria('Todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                categoriasSeleccionadas.length === 0
                  ? 'bg-[#218739] dark:bg-[#2fa350] text-white shadow-xs'
                  : 'bg-gray-50 dark:bg-[#121816] text-gray-600 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800/40'
              }`}
            >
              <span>📍</span>
              <span>Todos</span>
            </button>

            {CATEGORIAS_DISPONIBLES.map((cat) => {
              const activa = categoriasSeleccionadas.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleFiltroCategoria(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                    activa
                      ? 'bg-[#218739] dark:bg-[#2fa350] text-white shadow-xs'
                      : 'bg-gray-50 dark:bg-[#121816] text-gray-600 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <span>{cat.icono}</span>
                  <span>{cat.nombre}</span>
                  {activa && <span className="text-[10px] bg-white/20 px-1 rounded">✓</span>}
                </button>
              )
            })}
          </div>

          <div className="text-xs font-semibold text-gray-500 dark:text-[#a8b3ae] bg-gray-50 dark:bg-[#121816] px-3 py-1.5 rounded-xl">
            Mostrando <strong>{puntosFiltrados.length}</strong>{' '}
            {puntosFiltrados.length === 1 ? 'punto' : 'puntos'}
          </div>
        </div>


        {/* =================================================
            MODO SELECCIÓN
        ================================================= */}

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


        {/* =================================================
            UBICACIÓN SELECCIONADA
        ================================================= */}

        <AnimatePresence>
          {ubicacionSeleccionada && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-4 shadow-2xs"
            >
              <div>
                <span className="font-bold block text-sm">
                  📍 Coordenadas marcadas
                </span>
                <span className="font-mono text-[11px] mt-0.5 block">
                  Lat: {ubicacionSeleccionada[0].toFixed(6)} | Lng:{' '}
                  {ubicacionSeleccionada[1].toFixed(6)}
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


        {/* =================================================
            FORMULARIO NUEVO PUNTO (SELECCIÓN MÚLTIPLE DE CATEGORÍAS)
        ================================================= */}

        <AnimatePresence>
          {mostrarFormulario && (
            <motion.div
              initial={{
                opacity: 0,
                scale: prefiereReducido ? 1 : 0.96
              }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: prefiereReducido ? 1 : 0.96
              }}
              className="bg-white dark:bg-[#1a2320] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-xl transition-colors"
            >
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>➕</span>
                Registrar Nuevo Punto Ecológico
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

                {/* CATEGORÍAS (SELECCIÓN MÚLTIPLE - CHECKBOX STYLE) */}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2">
                    Categorías de residuos aceptadas (selecciona una o varias)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CATEGORIAS_DISPONIBLES.map((item) => {
                      const seleccionada = formulario.categorias.includes(item.id)

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => toggleCategoriaFormulario(item.id)}
                          className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                            seleccionada
                              ? 'bg-[#218739]/10 dark:bg-[#2fa350]/20 border-[#218739] dark:border-[#2fa350] text-[#218739] dark:text-[#2fa350] font-bold shadow-2xs'
                              : 'bg-gray-50 dark:bg-[#0f1512] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-[#a8b3ae] hover:bg-gray-100 dark:hover:bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icono}</span>
                            <span className="text-xs font-bold">{item.nombre}</span>
                          </div>

                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-colors ${
                              seleccionada
                                ? 'bg-[#218739] dark:bg-[#2fa350] text-white border-transparent'
                                : 'border-gray-300 dark:border-gray-700'
                            }`}
                          >
                            {seleccionada && '✓'}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

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

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={guardando}
                    whileHover={
                      prefiereReducido || guardando ? {} : { scale: 1.02 }
                    }
                    whileTap={
                      prefiereReducido || guardando ? {} : { scale: 0.98 }
                    }
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


        {/* =================================================
            MAPA
        ================================================= */}

        <div className="bg-white dark:bg-[#1a2320] rounded-3xl border border-gray-100 dark:border-gray-800/40 shadow-sm overflow-hidden h-[500px] sm:h-[600px] relative">
          {cargando && (
            <div className="absolute inset-0 z-20 bg-white/80 dark:bg-[#0f1512]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-[#218739]/30 border-t-[#218739] rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">
                Cargando capa interactiva...
              </p>
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
            {/* CAPA BASE */}
            <TileLayer
              key={tipoMapa}
              attribution={capasMapa[tipoMapa].attribution}
              url={capasMapa[tipoMapa].url}
            />

            {/* SELECTOR DE UBICACIÓN */}
            <SelectorUbicacion
              seleccionando={seleccionando}
              setUbicacion={manejarUbicacion}
              limiteCiudadBolivar={limiteCiudadBolivar}
            />

            {/* CONTROL DE VISTA */}
            <ControlVistaMapa ubicacion={ubicacionSeleccionada} />

            {/* LÍMITE CIUDAD BOLÍVAR */}
            {limiteCiudadBolivar && (
              <GeoJSON
                data={limiteCiudadBolivar}
                style={estiloCiudadBolivar}
              />
            )}

            {/* UBICACIÓN USUARIO */}
            {ubicacionUsuario && (
              <Marker position={ubicacionUsuario} icon={iconoUsuario}>
                <Popup>
                  <div className="p-1 text-xs font-sans">
                    <strong className="text-blue-600 block mb-1">
                      📍 Tu ubicación
                    </strong>
                    <span className="text-gray-600">
                      Esta es tu ubicación actual.
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* MARCADORES PUNTOS */}
            {puntosFiltrados.map((punto) => (
              <Marker
                key={punto.id}
                position={[punto.latitud, punto.longitud]}
                icon={obtenerIconoPorCategorias(punto.categorias)}
              >
                <Popup>
                  <div className="p-1 max-w-xs font-sans">
                    <div className="mb-2">
                      <CategoriasBadges categorias={punto.categorias} />
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 mb-1">
                      {punto.nombre}
                    </h3>

                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {punto.descripcion}
                    </p>

                    <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 space-y-1">
                      <div>
                        📍 <strong>Dirección:</strong> {punto.direccion}
                      </div>
                      <div>
                        🏙️ <strong>Localidad:</strong> {punto.localidad}
                      </div>
                    </div>

                    {/* RUTA */}
                    <button
                      type="button"
                      onClick={() => calcularRuta(punto)}
                      disabled={cargandoRuta && puntoRuta?.id === punto.id}
                      className="w-full mt-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                    >
                      {cargandoRuta && puntoRuta?.id === punto.id
                        ? '🚗 Calculando ruta...'
                        : '🚗 Cómo llegar'}
                    </button>

                    {/* ENTREGA */}
                    <button
                      type="button"
                      onClick={() => abrirFormularioEntrega(punto)}
                      className="w-full mt-2 px-3 py-2 bg-[#218739] hover:bg-[#176b2c] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      ♻️ Registrar entrega
                    </button>

                    {/* FORMULARIO ENTREGA */}
                    {mostrarEntrega && puntoEntrega?.id === punto.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-extrabold text-sm text-gray-900 mb-3">
                          Registrar entrega
                        </h4>

                        <p className="text-[11px] text-gray-500 mb-3">
                          Punto: {punto.nombre}
                        </p>

                        <form onSubmit={registrarEntrega} className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Tipo
                            </label>

                            <select
                              name="tipo"
                              value={formularioEntrega.tipo}
                              onChange={manejarCambioEntrega}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                            >
                              <option value="reciclaje">♻️ Reciclaje</option>
                              <option value="ropa">👕 Ropa</option>
                              <option value="electronicos">💻 Electrónicos</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Cantidad
                            </label>

                            <input
                              type="number"
                              name="cantidad"
                              min="0.01"
                              step="0.01"
                              placeholder="Ej: 5"
                              value={formularioEntrega.cantidad}
                              onChange={manejarCambioEntrega}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Unidad
                            </label>

                            <select
                              name="unidad"
                              value={formularioEntrega.unidad}
                              onChange={manejarCambioEntrega}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                            >
                              <option value="kg">Kilogramos (kg)</option>
                              <option value="unidades">Unidades</option>
                              <option value="prendas">Prendas</option>
                            </select>
                          </div>

                          {errorEntrega && (
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-[11px] font-bold">
                              ⚠️ {errorEntrega}
                            </div>
                          )}

                          {mensajeEntrega && (
                            <div className="p-2.5 bg-green-50 text-green-700 rounded-lg text-[11px] font-bold">
                              ✅ {mensajeEntrega}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={guardandoEntrega}
                              className="flex-1 px-3 py-2 bg-[#218739] hover:bg-[#176b2c] text-white rounded-lg text-xs font-bold disabled:opacity-60"
                            >
                              {guardandoEntrega ? 'Guardando...' : 'Registrar'}
                            </button>

                            <button
                              type="button"
                              onClick={cerrarFormularioEntrega}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* UBICACIÓN NUEVA */}
            {ubicacionSeleccionada && (
              <Marker position={ubicacionSeleccionada}>
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <strong className="text-[#218739] block mb-1">
                      📍 Nueva ubicación marcada
                    </strong>
                    <span>
                      Completa los datos en el panel superior para enviarlo a moderación.
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* BOTÓN DE CAPAS */}
          <div className="absolute top-4 right-4 z-[1000]">
            <button
              type="button"
              onClick={() => setMostrarCapas(!mostrarCapas)}
              className="bg-white dark:bg-[#1a2320] text-gray-800 dark:text-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-xs font-bold flex items-center gap-2 hover:scale-[1.02] transition-all"
            >
              <span>🗺️</span>
              <span>Capas</span>
              <span>{mostrarCapas ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {mostrarCapas && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="mt-2 bg-white dark:bg-[#1a2320] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 w-48"
                >
                  <p className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Tipo de mapa
                  </p>

                  {Object.entries(capasMapa).map(([id, capa]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTipoMapa(id)
                        setMostrarCapas(false)
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-left text-xs font-bold transition-all ${
                        tipoMapa === id
                          ? 'bg-[#218739] text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-base">{capa.icono}</span>
                      <span>{capa.nombre}</span>
                      {tipoMapa === id && <span className="ml-auto">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BOTÓN MI UBICACIÓN */}
          <div className="absolute bottom-5 right-4 z-[1000]">
            <button
              type="button"
              onClick={obtenerUbicacionUsuario}
              disabled={obteniendoUbicacion}
              title="Mostrar mi ubicación"
              className="w-11 h-11 bg-white dark:bg-[#1a2320] rounded-full shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg hover:scale-105 transition-all disabled:opacity-60"
            >
              {obteniendoUbicacion ? '⏳' : '📍'}
            </button>
          </div>

          {/* PANEL DE RUTA */}
          <AnimatePresence>
            {ruta && puntoRuta && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-5 left-4 z-[1000] bg-white dark:bg-[#1a2320] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-[280px] max-w-[calc(100%-80px)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚗</span>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">
                        Ruta más rápida
                      </h3>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                      Hacia:{' '}
                      <strong className="text-gray-800 dark:text-gray-200">
                        {puntoRuta.nombre}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={limpiarRuta}
                    className="text-gray-400 hover:text-red-500 text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-gray-50 dark:bg-[#121816] rounded-xl p-3">
                    <span className="block text-[10px] text-gray-400 uppercase font-bold">
                      📏 Distancia
                    </span>

                    <strong className="block text-sm text-gray-800 dark:text-white mt-1">
                      {formatearDistancia(ruta.distancia)}
                    </strong>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#121816] rounded-xl p-3">
                    <span className="block text-[10px] text-gray-400 uppercase font-bold">
                      ⏱️ Tiempo
                    </span>

                    <strong className="block text-sm text-gray-800 dark:text-white mt-1">
                      {formatearDuracion(ruta.duracion)}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={limpiarRuta}
                  className="w-full mt-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all"
                >
                  ✕ Limpiar ruta
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ERROR DE RUTA */}
          {errorRuta && (
            <div className="absolute bottom-5 left-4 z-[1000] bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl shadow-lg px-4 py-3 text-xs font-bold max-w-xs">
              ⚠️ {errorRuta}
              <button
                type="button"
                onClick={() => setErrorRuta('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Mapa
