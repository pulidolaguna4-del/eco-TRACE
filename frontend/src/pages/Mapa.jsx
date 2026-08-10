import { useEffect, useState } from 'react'

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
import './Mapa.css'

function SelectorUbicacion({
  seleccionando,
  setUbicacion,
  limiteCiudadBolivar
}) {
  useMapEvents({
    click(e) {
      if (!seleccionando) {
        return
      }

      if (!limiteCiudadBolivar) {
        return
      }

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

function obtenerIconoPorTipo(tipo) {
  const tipoNormalizado = tipo?.toLowerCase()

  let emoji = '📍'
  let color = '#218739'

  if (tipoNormalizado === 'reciclaje') {
    emoji = '♻️'
    color = '#218739'
  }

  if (tipoNormalizado === 'ropa') {
    emoji = '👕'
    color = '#1976d2'
  }

  if (
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
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
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

  const centroCiudadBolivar = [4.575, -74.160]

  const [puntos, setPuntos] = useState([])
  const [limiteCiudadBolivar, setLimiteCiudadBolivar] = useState(null)

  const [tipoSeleccionado, setTipoSeleccionado] =
    useState('Todos')

  const [seleccionando, setSeleccionando] =
    useState(false)

  const [ubicacionSeleccionada, setUbicacionSeleccionada] =
    useState(null)

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

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


  useEffect(() => {

    const cargarDatos = async () => {

      try {

        const respuestaPuntos = await fetch(
          'http://127.0.0.1:8000/puntos'
        )

        if (!respuestaPuntos.ok) {
          throw new Error(
            'No se pudieron cargar los puntos'
          )
        }

        const datosPuntos =
          await respuestaPuntos.json()

        const puntosCiudadBolivar =
          datosPuntos.filter(
            (punto) =>
              punto.localidad?.toUpperCase() ===
                'CIUDAD BOLIVAR' ||
              punto.localidad?.toUpperCase() ===
                'CIUDAD BOLÍVAR'
          )

        setPuntos(puntosCiudadBolivar)


        const respuestaGeoJSON =
          await fetch(
            '/data/ciudadBolivar.geojson'
          )

        if (!respuestaGeoJSON.ok) {
          throw new Error(
            'No se pudo cargar el límite de Ciudad Bolívar'
          )
        }

        const datosGeoJSON =
          await respuestaGeoJSON.json()

        setLimiteCiudadBolivar(
          datosGeoJSON
        )

      } catch (error) {

        console.error(error)

        setError(
          'No se pudieron cargar los datos del mapa'
        )

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
            punto.tipo?.toLowerCase() ===
            tipoSeleccionado.toLowerCase()
        )


  const estiloCiudadBolivar = {
    color: '#218739',
    weight: 3,
    fillColor: '#218739',
    fillOpacity: 0.15
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

    console.log(
      'CREAR PUNTO: función ejecutada'
    )

    e.preventDefault()

    setError('')
    setMensaje('')


    if (!ubicacionSeleccionada) {

      setError(
        'Primero debes seleccionar una ubicación en el mapa'
      )

      return
    }


    if (
      !formulario.nombre ||
      !formulario.descripcion ||
      !formulario.direccion ||
      !formulario.tipo
    ) {

      setError(
        'Todos los campos son obligatorios'
      )

      return
    }


    const token =
      localStorage.getItem('access_token')


    console.log(
      'TOKEN EXISTE:',
      !!token
    )


    if (!token) {

      setError(
        'Debes iniciar sesión para crear un punto'
      )

      return
    }


    const datosEnviar = {

      nombre:
        formulario.nombre,

      descripcion:
        formulario.descripcion,

      direccion:
        formulario.direccion,

      localidad:
        'Ciudad Bolívar',

      tipo:
        formulario.tipo,

      latitud:
        ubicacionSeleccionada[0],

      longitud:
        ubicacionSeleccionada[1]

    }


    console.log(
      'DATOS QUE SE ENVIARÁN:',
      datosEnviar
    )


    try {

      setGuardando(true)


      const respuesta = await fetch(
        'http://127.0.0.1:8000/puntos',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },

          body:
            JSON.stringify(
              datosEnviar
            )
        }
      )


      console.log(
        'RESPUESTA POST:',
        respuesta.status
      )


      const datos =
        await respuesta.json()


      console.log(
        'DATOS POST:',
        datos
      )


      if (!respuesta.ok) {

        setError(
          datos.detail ||
          'No se pudo crear el punto'
        )

        return
      }


      setMensaje(
  '¡Punto creado correctamente! Quedó pendiente de aprobación.'
)

setFormulario({
  nombre: '',
  descripcion: '',
  direccion: '',
  tipo: ''
})

setUbicacionSeleccionada(null)
setSeleccionando(false)


      const respuestaPuntos =
        await fetch(
          'http://127.0.0.1:8000/puntos'
        )


      if (respuestaPuntos.ok) {

        const nuevosPuntos =
          await respuestaPuntos.json()


        const puntosCiudadBolivar =
          nuevosPuntos.filter(
            (punto) =>
              punto.localidad?.toUpperCase() ===
                'CIUDAD BOLIVAR' ||
              punto.localidad?.toUpperCase() ===
                'CIUDAD BOLÍVAR'
          )


        setPuntos(
          puntosCiudadBolivar
        )
      }

    } catch (error) {

      console.error(
        'ERROR AL CREAR PUNTO:',
        error
      )

      setError(
        'No se pudo conectar con el servidor'
      )

    } finally {

      setGuardando(false)

    }
  }


  return (

    <div className="mapa-page">

      <div className="mapa-header">

        <div>

          <h1>
            eco-TRACE
          </h1>

          <p>
            Puntos de reciclaje y donación
            de Ciudad Bolívar
          </p>

        </div>

      </div>


      <div className="mapa-container">


        <div
          style={{
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >

          <label
            htmlFor="filtro-tipo"
            style={{
              fontWeight: '600',
              color: '#333'
            }}
          >
            Mostrar:
          </label>


          <select
            id="filtro-tipo"
            value={
              tipoSeleccionado
            }
            onChange={(e) =>
              setTipoSeleccionado(
                e.target.value
              )
            }
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >

            <option value="Todos">
              Todos
            </option>

            <option value="Reciclaje">
              Reciclaje
            </option>

            <option value="Ropa">
              Ropa
            </option>

            <option value="Electrónicos">
              Electrónicos
            </option>

          </select>


          {!seleccionando && (

            <button
              type="button"
              onClick={
                iniciarSeleccion
              }
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '8px',
                background: '#218739',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Agregar punto
            </button>

          )}


          {seleccionando && (

            <button
              type="button"
              onClick={
                cancelarSeleccion
              }
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '8px',
                background: '#d93025',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

          )}

        </div>


        {seleccionando && (

          <div
            style={{
              marginBottom: '15px',
              padding: '12px 15px',
              background: '#e8f5e9',
              borderRadius: '8px',
              color: '#176b2b',
              fontWeight: '600'
            }}
          >
            Haz clic sobre el mapa para seleccionar
            la ubicación del nuevo punto.
          </div>

        )}


        {ubicacionSeleccionada && (

          <div
            style={{
              marginBottom: '15px',
              padding: '12px 15px',
              background: '#fff8e1',
              borderRadius: '8px',
              color: '#795548'
            }}
          >

            <strong>
              Ubicación seleccionada:
            </strong>

            <br />

            Latitud:{' '}
            {
              ubicacionSeleccionada[0]
                .toFixed(6)
            }

            <br />

            Longitud:{' '}
            {
              ubicacionSeleccionada[1]
                .toFixed(6)
            }

          </div>

        )}


        {mostrarFormulario && (

          <div
            style={{
              marginBottom: '20px',
              padding: '25px',
              background: 'white',
              borderRadius: '15px',
              boxShadow:
                '0 5px 20px rgba(0,0,0,0.10)'
            }}
          >

            <h2
              style={{
                marginTop: 0,
                color: '#218739'
              }}
            >
              Agregar punto
            </h2>


            <form
              onSubmit={
                crearPunto
              }
            >


              <div className="form-group">

                <label htmlFor="nombre">
                  Nombre del punto
                </label>

                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Ej: Punto de reciclaje"
                  value={
                    formulario.nombre
                  }
                  onChange={
                    manejarCambioFormulario
                  }
                />

              </div>


              <div className="form-group">

                <label htmlFor="descripcion">
                  Descripción
                </label>

                <input
                  type="text"
                  id="descripcion"
                  name="descripcion"
                  placeholder="Describe el punto"
                  value={
                    formulario.descripcion
                  }
                  onChange={
                    manejarCambioFormulario
                  }
                />

              </div>


              <div className="form-group">

                <label htmlFor="direccion">
                  Dirección
                </label>

                <input
                  type="text"
                  id="direccion"
                  name="direccion"
                  placeholder="Ej: Carrera 50 # 20-30"
                  value={
                    formulario.direccion
                  }
                  onChange={
                    manejarCambioFormulario
                  }
                />

              </div>


              <div className="form-group">

                <label htmlFor="tipo">
                  Tipo
                </label>

                <select
                  id="tipo"
                  name="tipo"
                  value={
                    formulario.tipo
                  }
                  onChange={
                    manejarCambioFormulario
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '13px 15px',
                    border:
                      '1px solid #ccc',
                    borderRadius: '10px',
                    fontSize: '15px'
                  }}
                >

                  <option value="">
                    Selecciona un tipo
                  </option>

                  <option value="Reciclaje">
                    Reciclaje
                  </option>

                  <option value="Ropa">
                    Ropa
                  </option>

                  <option value="Electrónicos">
                    Electrónicos
                  </option>

                </select>

              </div>


              {error && (

                <p
                  className="error-message"
                >
                  {error}
                </p>

              )}


              {mensaje && (

                <p
                  className="success-message"
                >
                  {mensaje}
                </p>

              )}


              <button
                type="submit"
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#218739',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: guardando
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: guardando
                    ? 0.7
                    : 1
                }}
              >

                {
                  guardando
                    ? 'Creando punto...'
                    : 'Crear punto'
                }

              </button>


            </form>

          </div>

        )}


        {cargando && (

          <p>
            Cargando mapa...
          </p>

        )}


        {error && !mostrarFormulario && (

          <p
            className="error-message"
          >
            {error}
          </p>

        )}


        <MapContainer
          center={
            centroCiudadBolivar
          }
          zoom={13}
          minZoom={12}
          maxZoom={18}
          scrollWheelZoom={true}
          className="mapa"
        >

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          <SelectorUbicacion
          seleccionando={seleccionando}
          setUbicacion={manejarUbicacion}
          limiteCiudadBolivar={limiteCiudadBolivar}
          />


          {limiteCiudadBolivar && (

            <GeoJSON
              data={
                limiteCiudadBolivar
              }
              style={
                estiloCiudadBolivar
              }
            />

          )}


          {puntosFiltrados.map(
            (punto) => (

              <Marker
              key={punto.id}
              position={[
                punto.latitud,
                punto.longitud
            ]}
            icon={obtenerIconoPorTipo(punto.tipo)}
            >

                <Popup>

                  <div>

                    <h3>
                      {punto.nombre}
                    </h3>

                    <p>
                      {punto.descripcion}
                    </p>

                    <p>
                      <strong>
                        Tipo:
                      </strong>{' '}
                      {punto.tipo}
                    </p>

                    <p>
                      <strong>
                        Localidad:
                      </strong>{' '}
                      {punto.localidad}
                    </p>

                    <p>
                      <strong>
                        Dirección:
                      </strong>{' '}
                      {punto.direccion}
                    </p>

                  </div>

                </Popup>

              </Marker>

            )
          )}


          {ubicacionSeleccionada && (

            <Marker
              position={
                ubicacionSeleccionada
              }
            >

              <Popup>
                Nueva ubicación seleccionada
              </Popup>

            </Marker>

          )}

        </MapContainer>

      </div>

    </div>

  )
}


export default Mapa

