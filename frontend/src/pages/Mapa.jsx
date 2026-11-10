import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  Polyline,
  Circle,
  useMapEvents
} from 'react-leaflet'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

import {
  buscarDireccion,
  calcularRuta as consultarRuta,
  direccionDeCoordenadas,
  enlaceGoogleMaps,
  estaEnCiudadBolivar,
  obtenerPosicionActual
} from '../utils/geo'

import {
  normalizarPunto,
  CATEGORIAS_DISPONIBLES,
  ESTADOS_CONSERVACION,
  obtenerIconoYColorPorCategorias,
  formatearMensajeError,
  tipoDeCategoria
} from '../utils/puntoUtils'
import { CategoriasBadges } from '../components/CategoriasBadges'
import ResenasPunto, { Estrellas } from '../components/ResenasPunto'


// =========================================================
// SELECTOR DE UBICACIÓN PARA CREAR PUNTOS
// =========================================================

// La validación (dentro de Ciudad Bolívar) la hace quien recibe el clic
function SelectorUbicacion({ seleccionando, onSeleccionar }) {
  useMapEvents({
    click(e) {
      if (!seleccionando) return
      onSeleccionar([e.latlng.lat, e.latlng.lng])
    }
  })

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
// ICONO DEL PUNTO QUE SE ESTÁ PROPONIENDO (ARRASTRABLE)
// =========================================================

const iconoNuevoPunto = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      background: #f59e0b;
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    "><span style="transform: rotate(45deg); font-size: 15px;">➕</span></div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34]
})

const MODOS_RUTA = {
  carro: { nombre: 'En carro', icono: '🚗', color: '#1976d2', trazo: null },
  pie: { nombre: 'A pie', icono: '🚶', color: '#7b1fa2', trazo: '2 10' }
}


// =========================================================
// FORMULARIO DE ENTREGA
// =========================================================

// La unidad sugerida depende del tipo de material
function unidadPorDefecto(tipo) {
  if (tipo === 'ropa') return 'prendas'
  if (tipo === 'electronicos') return 'unidades'
  return 'kg'
}

function formularioEntregaVacio(categoria = '') {
  const tipo = tipoDeCategoria(categoria)

  return {
    categoria,
    tipo,
    nombre_articulo: '',
    cantidad: '',
    unidad: unidadPorDefecto(tipo),
    peso: '',
    estado_conservacion: '',
    foto_url: ''
  }
}


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

  const [formularioEntrega, setFormularioEntrega] = useState(
    formularioEntregaVacio()
  )

  const [mensajeEntrega, setMensajeEntrega] = useState('')

  const [observacionEntrega, setObservacionEntrega] = useState('')

  const [errorEntrega, setErrorEntrega] = useState('')

  const [guardandoEntrega, setGuardandoEntrega] = useState(false)


  // =======================================================
  // RESEÑAS
  // =======================================================

  const [puntoResenas, setPuntoResenas] = useState(null)

  // Refleja en el mapa el nuevo promedio después de calificar
  const actualizarCalificacion = (puntoId, calificacion) => {
    setPuntos((actuales) =>
      actuales.map((p) => (p.id === puntoId ? { ...p, ...calificacion } : p))
    )
  }


  // =======================================================
  // REPORTE
  // =======================================================

  const [puntoReporte, setPuntoReporte] = useState(null)

  const [mostrarReporte, setMostrarReporte] = useState(false)

  const [motivoReporte, setMotivoReporte] = useState('')

  const [mensajeReporte, setMensajeReporte] = useState('')

  const [errorReporte, setErrorReporte] = useState('')

  const [guardandoReporte, setGuardandoReporte] = useState(false)


  // =======================================================
  // FORMULARIO PUNTO
  // =======================================================

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    localidad: 'Ciudad Bolívar',
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

  // { coordenadas: [[lat, lng]], distancia, duracion }
  const [ruta, setRuta] = useState(null)

  const [modoRuta, setModoRuta] = useState('carro')

  // Origen con el que se calculó la ruta (para cambiar de modo sin volver a pedir la ubicación)
  const [origenRuta, setOrigenRuta] = useState(null)

  // Precisión en metros de la última ubicación obtenida
  const [precisionUbicacion, setPrecisionUbicacion] = useState(null)

  // Instancia de Leaflet (para centrar, ajustar a la ruta y cerrar popups)
  const [mapa, setMapa] = useState(null)


  // =======================================================
  // UBICACIÓN DEL PUNTO NUEVO (MI UBICACIÓN / DIRECCIÓN / CLIC)
  // =======================================================

  const [textoDireccion, setTextoDireccion] = useState('')

  const [resultadosDireccion, setResultadosDireccion] = useState([])

  const [buscandoDireccion, setBuscandoDireccion] = useState(false)

  const [ubicandoPunto, setUbicandoPunto] = useState(false)

  // Error o aviso del panel de selección
  const [avisoSeleccion, setAvisoSeleccion] = useState('')

  // Nota bajo las coordenadas (precisión, ubicación aproximada...)
  const [notaUbicacion, setNotaUbicacion] = useState('')

  // Si el usuario escribió la dirección a mano, ya no se llena sola
  const direccionEditada = useRef(false)

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
  // EL MAPA SE REACOMODA SI CAMBIA EL TAMAÑO DE SU CAJA
  // (sin esto Leaflet deja zonas grises al cargar)
  // =======================================================

  useEffect(() => {
    if (!mapa) return

    const observador = new ResizeObserver(() => mapa.invalidateSize())
    observador.observe(mapa.getContainer())

    return () => observador.disconnect()
  }, [mapa])


  // =======================================================
  // OBTENER UBICACIÓN DEL USUARIO (BOTÓN 📍)
  // =======================================================

  const obtenerUbicacionUsuario = async () => {
    setErrorRuta('')
    setObteniendoUbicacion(true)

    try {
      const { coords, precision } = await obtenerPosicionActual()

      setUbicacionUsuario(coords)
      setPrecisionUbicacion(precision)
      mapa?.flyTo(coords, 16, { duration: 1 })
    } catch (err) {
      setErrorRuta(err.message)
    } finally {
      setObteniendoUbicacion(false)
    }
  }


  // =======================================================
  // CÓMO LLEGAR: RUTA DESDE MI UBICACIÓN HASTA EL PUNTO
  // =======================================================

  const calcularRuta = async (punto, modo = modoRuta, origenConocido = null) => {
    setErrorRuta('')
    setPuntoRuta(punto)
    setCargandoRuta(true)

    try {
      let origen = origenConocido

      if (!origen) {
        const { coords, precision } = await obtenerPosicionActual()
        origen = coords
        setUbicacionUsuario(coords)
        setPrecisionUbicacion(precision)
      }

      const nuevaRuta = await consultarRuta(
        origen,
        [punto.latitud, punto.longitud],
        modo
      )

      setOrigenRuta(origen)
      setModoRuta(modo)
      setRuta(nuevaRuta)

      // Cerrar el popup y encuadrar la ruta completa
      mapa?.closePopup()
      mapa?.fitBounds(L.latLngBounds([origen, ...nuevaRuta.coordenadas]), {
        padding: [60, 60],
        maxZoom: 17
      })
    } catch (err) {
      setErrorRuta(err.message)
      setRuta(null)
    } finally {
      setCargandoRuta(false)
    }
  }

  // Recalcula la misma ruta en carro o a pie, sin volver a pedir la ubicación
  const cambiarModoRuta = (modo) => {
    if (modo === modoRuta || !puntoRuta || !origenRuta || cargandoRuta) return
    calcularRuta(puntoRuta, modo, origenRuta)
  }


  // =======================================================
  // LIMPIAR RUTA
  // =======================================================

  const limpiarRuta = () => {
    setRuta(null)
    setPuntoRuta(null)
    setOrigenRuta(null)
    setErrorRuta('')
  }


  // =======================================================
  // UBICAR EL PUNTO NUEVO
  // =======================================================

  // Fija la ubicación del punto si está dentro de Ciudad Bolívar.
  // Devuelve false si queda por fuera (cada llamada muestra su aviso).
  const fijarUbicacionPunto = async (coords, { direccion, mover = true } = {}) => {
    if (!limiteCiudadBolivar || !estaEnCiudadBolivar(coords, limiteCiudadBolivar)) {
      return false
    }

    setAvisoSeleccion('')
    setResultadosDireccion([])
    setUbicacionSeleccionada(coords)
    setSeleccionando(false)
    setMostrarFormulario(true)
    setError('')
    setMensaje('')

    if (mover) {
      mapa?.flyTo(coords, 17, { duration: 1 })
    }

    // Prellenar la dirección sin pisar lo que el usuario escribió a mano
    if (!direccionEditada.current) {
      const sugerida = direccion ?? (await direccionDeCoordenadas(coords))

      if (sugerida && !direccionEditada.current) {
        setFormulario((prev) => ({ ...prev, direccion: sugerida }))
      }
    }

    return true
  }

  const usarMiUbicacionParaPunto = async () => {
    setAvisoSeleccion('')
    setResultadosDireccion([])
    setUbicandoPunto(true)

    try {
      const { coords, precision } = await obtenerPosicionActual()

      setUbicacionUsuario(coords)
      setPrecisionUbicacion(precision)

      const dentro = await fijarUbicacionPunto(coords)

      if (!dentro) {
        mapa?.flyTo(coords, 14, { duration: 1 })
        setAvisoSeleccion(
          'Tu ubicación actual está fuera de Ciudad Bolívar. Busca una dirección o haz clic dentro de la localidad.'
        )
        return
      }

      setNotaUbicacion(
        precision > 50
          ? `Ubicación aproximada (±${precision} m). Arrastra el marcador naranja si no está en el sitio exacto.`
          : 'Usamos tu ubicación actual. Puedes arrastrar el marcador naranja para ajustarla.'
      )
    } catch (err) {
      setAvisoSeleccion(err.message)
    } finally {
      setUbicandoPunto(false)
    }
  }

  const elegirResultadoDireccion = async (resultado) => {
    await fijarUbicacionPunto(resultado.coords, { direccion: textoDireccion.trim() })

    setNotaUbicacion(
      resultado.aproximada
        ? 'Ubicamos la vía, no la placa exacta. Arrastra el marcador naranja hasta el sitio.'
        : 'Revisa que el marcador naranja quede en el sitio correcto; puedes arrastrarlo.'
    )
  }

  const buscarDireccionPunto = async (e) => {
    e.preventDefault()

    const texto = textoDireccion.trim()

    if (texto.length < 4) {
      setAvisoSeleccion('Escribe una dirección más completa, por ejemplo "Calle 70 Sur # 18M-50".')
      return
    }

    setBuscandoDireccion(true)
    setAvisoSeleccion('')
    setResultadosDireccion([])

    try {
      const resultados = await buscarDireccion(texto, limiteCiudadBolivar)

      if (resultados.length === 0) {
        setAvisoSeleccion(
          'No encontramos esa dirección dentro de Ciudad Bolívar. Prueba solo con la vía (ej. "Calle 70 Sur") o haz clic en el mapa.'
        )
      } else if (resultados.length === 1) {
        await elegirResultadoDireccion(resultados[0])
      } else {
        setResultadosDireccion(resultados)
      }
    } catch (err) {
      setAvisoSeleccion(err.message)
    } finally {
      setBuscandoDireccion(false)
    }
  }

  const seleccionarEnMapa = async (coords) => {
    const dentro = await fijarUbicacionPunto(coords, { mover: false })

    if (!dentro) {
      setAvisoSeleccion(
        'Esa ubicación está fuera de Ciudad Bolívar. Haz clic dentro del área verde.'
      )
      return
    }

    setNotaUbicacion('Puedes arrastrar el marcador naranja para ajustar la ubicación.')
  }

  // Al soltar el marcador arrastrable
  const moverMarcadorPunto = async (evento) => {
    const marcador = evento.target
    const { lat, lng } = marcador.getLatLng()

    const dentro = await fijarUbicacionPunto([lat, lng], { mover: false })

    if (!dentro) {
      marcador.setLatLng(ubicacionSeleccionada)
      setError('El punto debe quedar dentro de Ciudad Bolívar.')
      return
    }

    setNotaUbicacion('Ubicación ajustada a mano.')
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
    if (name === 'direccion') direccionEditada.current = value.trim() !== ''
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
    setAvisoSeleccion('')
    setResultadosDireccion([])
    setNotaUbicacion('')
  }

  const cancelarSeleccion = () => {
    setSeleccionando(false)
    setUbicacionSeleccionada(null)
    setMostrarFormulario(false)
    setAvisoSeleccion('')
    setResultadosDireccion([])
    setNotaUbicacion('')
    setTextoDireccion('')
    direccionEditada.current = false
    setFormulario({
      nombre: '',
      descripcion: '',
      direccion: '',
      localidad: 'Ciudad Bolívar',
      categorias: []
    })
    setMensaje('')
    setError('')
  }


  // =======================================================
// CREAR PUNTO
// =======================================================

const crearPunto = async (e) => {
  e.preventDefault()

  if (guardando) return

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
    !formulario.localidad
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
    nombre: formulario.nombre.trim(),
    descripcion: formulario.descripcion.trim(),
    direccion: formulario.direccion.trim(),
    localidad: (formulario.localidad || 'Ciudad Bolívar').trim(),
    latitud: ubicacionSeleccionada[0],
    longitud: ubicacionSeleccionada[1],
    categorias: formulario.categorias
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
      setError(formatearMensajeError(datos?.detail, 'No se pudo crear el punto'))
      return
    }

    setMensaje('¡Punto creado correctamente! Quedó pendiente de aprobación.')

    setFormulario({
      nombre: '',
      descripcion: '',
      direccion: '',
      localidad: 'Ciudad Bolívar',
      categorias: []
    })

    setUbicacionSeleccionada(null)
    setMostrarFormulario(false)
    setNotaUbicacion('')
    setTextoDireccion('')
    direccionEditada.current = false

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
  // ABRIR FORMULARIO DE REPORTE
  // =======================================================

  const abrirFormularioReporte = (punto) => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      navigate('/login')
      return
    }

    setPuntoReporte(punto)
    setMostrarReporte(true)
    setMotivoReporte('')
    setMensajeReporte('')
    setErrorReporte('')
  }


  // =======================================================
  // CERRAR REPORTE
  // =======================================================

  const cerrarFormularioReporte = () => {
    setMostrarReporte(false)
    setPuntoReporte(null)
    setMotivoReporte('')
    setMensajeReporte('')
    setErrorReporte('')
  }


  // =======================================================
  // REGISTRAR REPORTE
  // =======================================================

  const registrarReporte = async (e) => {
    e.preventDefault()

    setErrorReporte('')
    setMensajeReporte('')

    const token = localStorage.getItem('access_token')

    if (!token) {
      navigate('/login')
      return
    }

    if (!puntoReporte) {
      setErrorReporte('No se seleccionó ningún punto')
      return
    }

    const motivo = motivoReporte.trim()

    if (motivo.length < 5) {
      setErrorReporte('Explica el motivo con al menos 5 caracteres')
      return
    }

    try {
      setGuardandoReporte(true)

      const respuesta = await fetch('http://127.0.0.1:8000/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          punto_id: puntoReporte.id,
          motivo
        })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setErrorReporte(
          formatearMensajeError(datos?.detail, 'No se pudo registrar el reporte')
        )
        return
      }

      setMensajeReporte(
        '¡Reporte enviado correctamente! Será revisado por un administrador.'
      )
      setMotivoReporte('')
    } catch (err) {
      console.error(err)
      setErrorReporte('No se pudo conectar con el servidor')
    } finally {
      setGuardandoReporte(false)
    }
  }


  // =======================================================
// ABRIR / CERRAR ENTREGA
// =======================================================

const abrirFormularioEntrega = (punto) => {
  setPuntoEntrega(punto)
  setMostrarEntrega(true)

  setFormularioEntrega(formularioEntregaVacio(punto.categorias?.[0] || ''))

  setObservacionEntrega('')
  setMensajeEntrega('')
  setErrorEntrega('')
}

const cerrarFormularioEntrega = () => {
  setMostrarEntrega(false)
  setPuntoEntrega(null)

  setFormularioEntrega(formularioEntregaVacio())

  setObservacionEntrega('')
  setMensajeEntrega('')
  setErrorEntrega('')
}


  // =======================================================
  // CAMBIO ENTREGA
  // =======================================================

  const manejarCambioEntrega = (e) => {
    const { name, value } = e.target

    setFormularioEntrega((prev) => {
      // Al cambiar la categoría se ajustan el tipo y la unidad sugerida
      if (name === 'categoria') {
        const tipo = tipoDeCategoria(value)
        return {
          ...prev,
          categoria: value,
          tipo,
          unidad: unidadPorDefecto(tipo),
          estado_conservacion: tipo === 'reciclaje' ? '' : prev.estado_conservacion
        }
      }

      return { ...prev, [name]: value }
    })

    setErrorEntrega('')
    setMensajeEntrega('')
  }


  /// =======================================================
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

  const enKilos = formularioEntrega.unidad === 'kg'

  if (!enKilos && formularioEntrega.peso && Number(formularioEntrega.peso) <= 0) {
    setErrorEntrega('El peso debe ser mayor que 0')
    return
  }

  const fotoUrl = formularioEntrega.foto_url.trim()

  if (fotoUrl && !/^https?:\/\//i.test(fotoUrl)) {
    setErrorEntrega('La URL de la foto debe empezar por http:// o https://')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setErrorEntrega('Debes iniciar sesión para registrar una entrega')
    return
  }

  const datosEnviar = {
    punto_id: puntoEntrega.id,
    categoria: formularioEntrega.categoria || null,
    tipo: formularioEntrega.tipo,
    nombre_articulo: formularioEntrega.nombre_articulo.trim() || null,
    cantidad: Number(formularioEntrega.cantidad),
    unidad: formularioEntrega.unidad,
    peso: !enKilos && formularioEntrega.peso
      ? Number(formularioEntrega.peso)
      : null,
    estado_conservacion: formularioEntrega.estado_conservacion || null,
    foto_url: fotoUrl || null,
    observacion: observacionEntrega.trim() || null
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
      setErrorEntrega(
        formatearMensajeError(datos?.detail, 'No se pudo registrar la entrega')
      )
      return
    }

    setMensajeEntrega(
      '¡Entrega registrada! Quedó pendiente de verificación y puedes verla en tu historial.'
    )

    setFormularioEntrega({
      ...formularioEntregaVacio(formularioEntrega.categoria),
      unidad: formularioEntrega.unidad
    })

    setObservacionEntrega('')
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
              className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl shadow-2xs space-y-4"
            >
              <p className="text-sm font-extrabold text-[#218739] dark:text-[#2fa350]">
                📍 ¿Dónde está el nuevo punto ecológico?
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start">
                {/* OPCIÓN 1: MI UBICACIÓN */}
                <button
                  type="button"
                  onClick={usarMiUbicacionParaPunto}
                  disabled={ubicandoPunto}
                  className="px-4 py-3 bg-[#1976d2] hover:bg-[#1565c0] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {ubicandoPunto ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Obteniendo tu ubicación...
                    </>
                  ) : (
                    <>🎯 Usar mi ubicación actual</>
                  )}
                </button>

                {/* OPCIÓN 2: BUSCAR UNA DIRECCIÓN */}
                <form onSubmit={buscarDireccionPunto} className="flex gap-2" role="search">
                  <label htmlFor="buscar-direccion" className="sr-only">
                    Buscar una dirección
                  </label>
                  <input
                    id="buscar-direccion"
                    type="text"
                    value={textoDireccion}
                    onChange={(e) => {
                      setTextoDireccion(e.target.value)
                      setAvisoSeleccion('')
                    }}
                    placeholder='O escribe una dirección: "Calle 70 Sur # 18M-50"'
                    className="flex-1 min-w-0 px-4 py-3 text-xs rounded-xl bg-white dark:bg-[#0f1512] text-gray-900 dark:text-white border border-emerald-200 dark:border-emerald-900/40 focus:outline-hidden focus:border-[#218739] dark:focus:border-[#2fa350]"
                  />
                  <button
                    type="submit"
                    disabled={buscandoDireccion}
                    className="px-4 py-3 bg-[#218739] hover:bg-[#176b2b] disabled:opacity-60 text-white text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap"
                  >
                    {buscandoDireccion ? 'Buscando...' : '🔎 Buscar'}
                  </button>
                </form>
              </div>

              {/* RESULTADOS DE LA BÚSQUEDA */}
              {resultadosDireccion.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-600 dark:text-[#a8b3ae] mb-2">
                    Encontramos varias coincidencias, elige la correcta:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {resultadosDireccion.map((resultado) => (
                      <li key={resultado.coords.join(',')}>
                        <button
                          type="button"
                          onClick={() => elegirResultadoDireccion(resultado)}
                          className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-[#0f1512] border border-emerald-200 dark:border-emerald-900/40 hover:border-[#218739] text-xs font-semibold text-gray-800 dark:text-[#f2f5f3] cursor-pointer"
                        >
                          📍 {resultado.etiqueta}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {avisoSeleccion && (
                <p className="text-xs font-bold text-[#d93025] dark:text-[#ef5350] bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2">
                  ⚠️ {avisoSeleccion}
                </p>
              )}

              {/* OPCIÓN 3: CLIC EN EL MAPA */}
              <p className="text-[11px] font-semibold text-gray-600 dark:text-[#a8b3ae]">
                🖱️ También puedes hacer clic directamente sobre el mapa, dentro del área verde de Ciudad Bolívar.
              </p>
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
                  📍 Ubicación del nuevo punto
                </span>
                <span className="font-mono text-[11px] mt-0.5 block">
                  Lat: {ubicacionSeleccionada[0].toFixed(6)} | Lng:{' '}
                  {ubicacionSeleccionada[1].toFixed(6)}
                </span>
                {notaUbicacion && (
                  <span className="text-[11px] font-semibold mt-1 block">
                    {notaUbicacion}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <button
                  type="button"
                  onClick={iniciarSeleccion}
                  className="px-3 py-1.5 bg-white dark:bg-transparent border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cambiar ubicación
                </button>

                {!mostrarFormulario && (
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs"
                  >
                    Completar datos
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* CONFIRMACIÓN DESPUÉS DE ENVIAR (el formulario ya se ocultó) */}
        <AnimatePresence>
          {mensaje && !mostrarFormulario && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              role="status"
              className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl text-xs font-bold text-[#218739] dark:text-[#2fa350] flex items-center justify-between gap-4 shadow-2xs"
            >
              <span>🎉 {mensaje}</span>
              <button
                type="button"
                onClick={() => setMensaje('')}
                className="text-[#218739] dark:text-[#2fa350] hover:opacity-70 cursor-pointer"
                aria-label="Cerrar mensaje"
              >
                ✕
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-[#f2f5f3] uppercase tracking-wider mb-2">
                      Localidad
                    </label>
                    <input
                      type="text"
                      name="localidad"
                      placeholder="Ej: Ciudad Bolívar"
                      value={formulario.localidad}
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
                    ⚠️ {typeof error === 'string' ? error : formatearMensajeError(error)}
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
            ref={setMapa}
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
              onSeleccionar={seleccionarEnMapa}
            />

            {/* LÍMITE CIUDAD BOLÍVAR */}
            {limiteCiudadBolivar && (
              <GeoJSON
                data={limiteCiudadBolivar}
                style={estiloCiudadBolivar}
              />
            )}

            {/* RUTA: borde blanco debajo para que se lea sobre cualquier capa */}
            {ruta && (
              <>
                <Polyline
                  positions={ruta.coordenadas}
                  pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }}
                />
                <Polyline
                  positions={ruta.coordenadas}
                  pathOptions={{
                    color: MODOS_RUTA[modoRuta].color,
                    weight: 5,
                    opacity: 0.95,
                    dashArray: MODOS_RUTA[modoRuta].trazo,
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
                />
              </>
            )}

            {/* UBICACIÓN USUARIO (con su margen de error) */}
            {ubicacionUsuario && precisionUbicacion > 30 && (
              <Circle
                center={ubicacionUsuario}
                radius={precisionUbicacion}
                pathOptions={{ color: '#1976d2', weight: 1, fillColor: '#1976d2', fillOpacity: 0.08 }}
                interactive={false}
              />
            )}

            {ubicacionUsuario && (
              <Marker position={ubicacionUsuario} icon={iconoUsuario} zIndexOffset={500}>
                <Popup>
                  <div className="p-1 text-xs font-sans">
                    <strong className="text-blue-600 block mb-1">
                      📍 Tu ubicación
                    </strong>
                    <span className="text-gray-600">
                      {precisionUbicacion
                        ? `Precisión aproximada: ±${precisionUbicacion} m`
                        : 'Esta es tu ubicación actual.'}
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

        <button
          type="button"
          onClick={() => setPuntoResenas(punto)}
          className="flex items-center gap-1.5 mb-2 text-[11px] text-gray-600 hover:text-amber-600 cursor-pointer"
          aria-label={`Ver reseñas de ${punto.nombre}`}
        >
          {punto.total_resenas > 0 ? (
            <>
              <Estrellas valor={punto.calificacion_promedio} tamano="text-xs" />
              <strong className="text-gray-800">
                {Number(punto.calificacion_promedio).toLocaleString('es-CO', { maximumFractionDigits: 1 })}
              </strong>
              <span>({punto.total_resenas})</span>
            </>
          ) : (
            <span>☆ Sin reseñas todavía</span>
          )}
        </button>

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

        {/* RESEÑAS */}
        <button
          type="button"
          onClick={() => setPuntoResenas(punto)}
          className="w-full mt-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          ⭐ Calificar y ver reseñas
        </button>

        {/* REPORTE */}
        <button
          type="button"
          onClick={() => abrirFormularioReporte(punto)}
          className="w-full mt-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          🚩 Reportar punto
        </button>

        {/* ENTREGA */}
        <button
          type="button"
          onClick={() => abrirFormularioEntrega(punto)}
          className="w-full mt-2 px-3 py-2 bg-[#218739] hover:bg-[#176b2c] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          ♻️ Registrar entrega
        </button>

      </div>
    </Popup>
  </Marker>
))}

{/* UBICACIÓN NUEVA */}
{ubicacionSeleccionada && (
  <Marker
    position={ubicacionSeleccionada}
    icon={iconoNuevoPunto}
    draggable
    zIndexOffset={1000}
    eventHandlers={{ dragend: moverMarcadorPunto }}
  >
    <Popup>
      <div className="p-1 font-sans text-xs">
        <strong className="text-[#218739] block mb-1">
          📍 Nueva ubicación marcada
        </strong>

        <span>
          Arrástrame para ajustar el sitio y completa los datos en el panel superior.
        </span>
      </div>
    </Popup>
  </Marker>
)}
</MapContainer>

{/* =========================================================
    MODAL RESEÑAS
========================================================= */}
<AnimatePresence>
  {puntoResenas && (
    <ResenasPunto
      key={puntoResenas.id}
      punto={puntoResenas}
      onCerrar={() => setPuntoResenas(null)}
      onCalificacionActualizada={actualizarCalificacion}
    />
  )}
</AnimatePresence>

{/* =========================================================
    MODAL REGISTRAR ENTREGA
========================================================= */}
<AnimatePresence>
  {mostrarEntrega && puntoEntrega && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-entrega"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md max-h-[90%] overflow-y-auto bg-white dark:bg-[#1a2320] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ENCABEZADO */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">

          <button
            type="button"
            onClick={cerrarFormularioEntrega}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-2xl">
              ♻️
            </div>

            <div>
              <h2
                id="titulo-modal-entrega"
                className="text-xl font-extrabold text-gray-900 dark:text-white"
              >
                Registrar entrega
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Registra los residuos que entregaste en este punto.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="px-6 py-5">

          {/* PUNTO SELECCIONADO */}
          <div className="mb-5 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 p-4">

            <p className="text-[11px] uppercase tracking-wide font-bold text-green-700 dark:text-green-400 mb-1">
              Punto seleccionado
            </p>

            <p className="text-base font-extrabold text-gray-900 dark:text-white">
              {puntoEntrega.nombre}
            </p>

            {puntoEntrega.categorias?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {puntoEntrega.categorias.map((categoria, index) => (
                  <span
                    key={`${categoria}-${index}`}
                    className="px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                  >
                    {categoria}
                  </span>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={registrarEntrega} className="space-y-5">

            {/* CATEGORÍA */}
            <div>
              <label
                htmlFor="categoria-entrega"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                Categoría del material
              </label>

              {puntoEntrega.categorias?.length > 1 ? (
                <>
                  <select
                    id="categoria-entrega"
                    name="categoria"
                    value={formularioEntrega.categoria}
                    onChange={manejarCambioEntrega}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  >
                    {puntoEntrega.categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                    Este punto recibe varias categorías: elige la de tu entrega.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {formularioEntrega.tipo === 'ropa' && '👕 '}
                    {formularioEntrega.tipo === 'electronicos' && '💻 '}
                    {formularioEntrega.tipo === 'reciclaje' && '♻️ '}
                    {formularioEntrega.categoria || 'Reciclaje'}
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                    Es la categoría que recibe este punto.
                  </p>
                </>
              )}
            </div>

            {/* ARTÍCULO */}
            <div>
              <label
                htmlFor="articulo-entrega"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                ¿Qué entregaste?
                <span className="font-normal text-gray-400 ml-1">
                  (opcional)
                </span>
              </label>

              <input
                id="articulo-entrega"
                type="text"
                name="nombre_articulo"
                maxLength={120}
                placeholder={
                  formularioEntrega.tipo === 'ropa'
                    ? 'Ej: Chaquetas y pantalones'
                    : formularioEntrega.tipo === 'electronicos'
                    ? 'Ej: Celular y cargador'
                    : 'Ej: Botellas plásticas y cartón'
                }
                value={formularioEntrega.nombre_articulo}
                onChange={manejarCambioEntrega}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* CANTIDAD */}
            <div>
              <label
                htmlFor="cantidad-entrega"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                Cantidad entregada *
              </label>

              <input
                id="cantidad-entrega"
                type="number"
                name="cantidad"
                min="0.01"
                step="0.01"
                placeholder="Ej: 5"
                value={formularioEntrega.cantidad}
                onChange={manejarCambioEntrega}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* UNIDAD */}
            <div>
              <label
                htmlFor="unidad-entrega"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                Unidad *
              </label>

              <select
                id="unidad-entrega"
                name="unidad"
                value={formularioEntrega.unidad}
                onChange={manejarCambioEntrega}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="unidades">Unidades</option>
                <option value="prendas">Prendas</option>
              </select>
            </div>

            {/* PESO (solo si la unidad no es kg) */}
            {formularioEntrega.unidad !== 'kg' && (
              <div>
                <label
                  htmlFor="peso-entrega"
                  className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
                >
                  Peso aproximado (kg)
                  <span className="font-normal text-gray-400 ml-1">
                    (opcional)
                  </span>
                </label>

                <input
                  id="peso-entrega"
                  type="number"
                  name="peso"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej: 2.5"
                  value={formularioEntrega.peso}
                  onChange={manejarCambioEntrega}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                />

                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                  Suma al total de kilos del dashboard de impacto.
                </p>
              </div>
            )}

            {/* ESTADO DE CONSERVACIÓN (ropa y electrónicos) */}
            {formularioEntrega.tipo !== 'reciclaje' && (
              <div>
                <label
                  htmlFor="conservacion-entrega"
                  className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
                >
                  Estado de conservación
                  <span className="font-normal text-gray-400 ml-1">
                    (opcional)
                  </span>
                </label>

                <select
                  id="conservacion-entrega"
                  name="estado_conservacion"
                  value={formularioEntrega.estado_conservacion}
                  onChange={manejarCambioEntrega}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                >
                  <option value="">Sin especificar</option>
                  {ESTADOS_CONSERVACION.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* FOTO */}
            <div>
              <label
                htmlFor="foto-entrega"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                URL de una foto
                <span className="font-normal text-gray-400 ml-1">
                  (opcional)
                </span>
              </label>

              <input
                id="foto-entrega"
                type="url"
                name="foto_url"
                maxLength={500}
                placeholder="https://..."
                value={formularioEntrega.foto_url}
                onChange={manejarCambioEntrega}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>

            {/* FECHA */}
            <div>
              <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                Fecha de entrega
              </label>

              <div className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200">
                📅 {new Date().toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                Fecha registrada automáticamente.
              </p>
            </div>

            {/* OBSERVACIÓN */}
            <div>
              <label
                htmlFor="observacion-entrega"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                Observación
                <span className="font-normal text-gray-400 ml-1">
                  (opcional)
                </span>
              </label>

              <textarea
                id="observacion-entrega"
                value={observacionEntrega}
                onChange={(e) => setObservacionEntrega(e.target.value)}
                rows="3"
                placeholder="Puedes agregar algún detalle sobre la entrega..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
              />
            </div>

            {/* ERROR */}
            {errorEntrega && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                ⚠️ {errorEntrega}
              </div>
            )}

            {/* ÉXITO */}
            {mensajeEntrega && (
              <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                ✅ {mensajeEntrega}
              </div>
            )}

            {/* BOTONES */}
            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={cerrarFormularioEntrega}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardandoEntrega}
                className="flex-1 px-4 py-3 rounded-xl bg-[#218739] hover:bg-[#176b2c] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-sm"
              >
                {guardandoEntrega
                  ? 'Guardando...'
                  : 'Registrar entrega'}
              </button>

            </div>

          </form>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


{/* =========================================================
    MODAL REPORTAR PUNTO
========================================================= */}
<AnimatePresence>
  {mostrarReporte && puntoReporte && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-[2000] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-reporte"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md bg-white dark:bg-[#1a2320] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ENCABEZADO */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">

          <button
            type="button"
            onClick={cerrarFormularioReporte}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl">
              🚩
            </div>

            <div>
              <h2
                id="titulo-modal-reporte"
                className="text-xl font-extrabold text-gray-900 dark:text-white"
              >
                Reportar punto ecológico
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ayúdanos a mantener actualizada la información de los puntos.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="px-6 py-5">

          {/* PUNTO SELECCIONADO */}
          <div className="mb-5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 p-4">

            <p className="text-[11px] uppercase tracking-wide font-bold text-red-700 dark:text-red-400 mb-1">
              Punto seleccionado
            </p>

            <p className="text-base font-extrabold text-gray-900 dark:text-white">
              {puntoReporte.nombre}
            </p>

            {puntoReporte.direccion && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                📍 {puntoReporte.direccion}
              </p>
            )}

            {puntoReporte.localidad && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                🏙️ {puntoReporte.localidad}
              </p>
            )}
          </div>

          <form onSubmit={registrarReporte} className="space-y-5">

            {/* MOTIVO */}
            <div>
              <label
                htmlFor="motivo-reporte"
                className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2"
              >
                ¿Qué problema encontraste? *
              </label>

              <textarea
                id="motivo-reporte"
                value={motivoReporte}
                onChange={(e) => {
                  setMotivoReporte(e.target.value)
                  setErrorReporte('')
                  setMensajeReporte('')
                }}
                minLength={5}
                maxLength={500}
                required
                rows={5}
                placeholder="Ej.: el establecimiento está cerrado o ya no recibe materiales..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
              />

              <div className="flex justify-between items-center mt-1.5">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Describe claramente el problema encontrado.
                </p>

                <p
                  className={`text-[10px] font-bold ${
                    motivoReporte.length >= 450
                      ? 'text-red-500'
                      : 'text-gray-400'
                  }`}
                >
                  {motivoReporte.length}/500
                </p>
              </div>
            </div>

            {/* ERROR */}
            {errorReporte && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                ⚠️ {errorReporte}
              </div>
            )}

            {/* ÉXITO */}
            {mensajeReporte && (
              <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                ✅ {mensajeReporte}
              </div>
            )}

            {/* BOTONES */}
            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={cerrarFormularioReporte}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardandoReporte}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition shadow-sm"
              >
                {guardandoReporte
                  ? 'Enviando...'
                  : 'Enviar reporte'}
              </button>

            </div>

          </form>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{/* BOTÓN DE CAPAS */}

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
                      <span className="text-xl">{MODOS_RUTA[modoRuta].icono}</span>
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">
                        Ruta {MODOS_RUTA[modoRuta].nombre.toLowerCase()}
                      </h3>
                    </div>

                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                      Desde tu ubicación hasta{' '}
                      <strong className="text-gray-800 dark:text-gray-200">
                        {puntoRuta.nombre}
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={limpiarRuta}
                    className="text-gray-400 hover:text-red-500 text-lg cursor-pointer"
                    aria-label="Cerrar la ruta"
                  >
                    ✕
                  </button>
                </div>

                {/* CARRO / A PIE */}
                <div className="grid grid-cols-2 gap-1 mt-3 p-1 rounded-xl bg-gray-100 dark:bg-[#121816]" role="group" aria-label="Modo de transporte">
                  {Object.entries(MODOS_RUTA).map(([id, modo]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => cambiarModoRuta(id)}
                      disabled={cargandoRuta}
                      aria-pressed={modoRuta === id}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-wait ${
                        modoRuta === id
                          ? 'bg-white dark:bg-[#1a2320] text-gray-900 dark:text-white shadow-xs'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      {modo.icono} {modo.nombre}
                    </button>
                  ))}
                </div>

                <div className={`grid grid-cols-2 gap-2 mt-3 transition-opacity ${cargandoRuta ? 'opacity-50' : ''}`}>
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

                {origenRuta && (
                  <a
                    href={enlaceGoogleMaps(origenRuta, [puntoRuta.latitud, puntoRuta.longitud], modoRuta)}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full mt-3 py-2 text-center bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-xl text-xs font-bold transition-all"
                  >
                    🧭 Navegar paso a paso en Google Maps
                  </a>
                )}

                <button
                  type="button"
                  onClick={limpiarRuta}
                  className="w-full mt-2 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
