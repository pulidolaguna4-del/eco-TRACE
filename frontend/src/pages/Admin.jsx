import { useEffect, useState } from 'react'
import './Admin.css'

function Admin() {
  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null)

  const cargarPuntosPendientes = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Debes iniciar sesión como administrador')
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')
      setMensaje('')

      const respuesta = await fetch(
        'http://127.0.0.1:8000/admin/puntos/pendientes',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          setError('Debes iniciar sesión')
          return
        }

        if (respuesta.status === 403) {
          setError('Debes iniciar sesión como administrador')
          return
        }

        throw new Error(
          datos.detail || 'No se pudieron cargar los puntos'
        )
      }

      setPuntos(datos)
    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarPuntosPendientes()
  }, [])

  const cambiarEstado = async (puntoId, accion) => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Tu sesión ha expirado')
      return
    }

    try {
      setProcesando(puntoId)
      setError('')
      setMensaje('')

      const respuesta = await fetch(
        `http://127.0.0.1:8000/admin/puntos/${puntoId}/${accion}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || 'No se pudo actualizar el punto'
        )
      }

      if (accion === 'aprobar') {
        setMensaje('Punto aprobado correctamente')
      } else {
        setMensaje('Punto rechazado correctamente')
      }

      setPuntos((puntosActuales) =>
        puntosActuales.filter(
          (punto) => punto.id !== puntoId
        )
      )
    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setProcesando(null)
    }
  }

  return (
    <div className="admin-page">

      <div className="admin-header">
        <h1>eco-TRACE</h1>
        <p>Panel de administración</p>
      </div>

      <main className="admin-container">

        <div className="admin-title">
          <div>
            <h2>Puntos pendientes</h2>
            <p>
              Revisa los puntos enviados por los usuarios.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh"
            onClick={cargarPuntosPendientes}
          >
            Actualizar
          </button>
        </div>

        {cargando && (
          <p className="admin-info">
            Cargando puntos pendientes...
          </p>
        )}

        {error && (
          <p className="admin-error">
            {error}
          </p>
        )}

        {mensaje && (
          <p className="admin-success">
            {mensaje}
          </p>
        )}

        {!cargando && !error && puntos.length === 0 && (
          <div className="admin-empty">
            <h3>No hay puntos pendientes</h3>
            <p>
              Todos los puntos enviados han sido revisados.
            </p>
          </div>
        )}

        <div className="admin-list">

          {puntos.map((punto) => (

            <div
              className="admin-card"
              key={punto.id}
            >

              <div className="admin-card-header">

                <h3>
                  {punto.nombre}
                </h3>

                <span>
                  {punto.tipo}
                </span>

              </div>

              <p>
                {punto.descripcion}
              </p>

              <div className="admin-data">

                <p>
                  <strong>Dirección:</strong>{' '}
                  {punto.direccion}
                </p>

                <p>
                  <strong>Localidad:</strong>{' '}
                  {punto.localidad}
                </p>

                <p>
                  <strong>Latitud:</strong>{' '}
                  {punto.latitud}
                </p>

                <p>
                  <strong>Longitud:</strong>{' '}
                  {punto.longitud}
                </p>

                <p>
                  <strong>Usuario:</strong>{' '}
                  {punto.usuario_id}
                </p>

              </div>

              <div className="admin-actions">

                <button
                  type="button"
                  className="approve-button"
                  disabled={procesando === punto.id}
                  onClick={() =>
                    cambiarEstado(
                      punto.id,
                      'aprobar'
                    )
                  }
                >
                  {procesando === punto.id
                    ? 'Procesando...'
                    : 'Aprobar'}
                </button>

                <button
                  type="button"
                  className="reject-button"
                  disabled={procesando === punto.id}
                  onClick={() =>
                    cambiarEstado(
                      punto.id,
                      'rechazar'
                    )
                  }
                >
                  Rechazar
                </button>

              </div>

            </div>

          ))}

        </div>

      </main>

    </div>
  )
}

export default Admin
