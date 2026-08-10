import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      try {
        const partes = token.split('.')

        if (partes.length === 3) {
          const payload = JSON.parse(
            atob(partes[1].replace(/-/g, '+').replace(/_/g, '/'))
          )

          setEsAdmin(payload.es_admin === true)
        }
      } catch (error) {
        console.error('No se pudo leer el token')
      }
    }
  }, [])

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        const respuesta = await fetch(
          'http://127.0.0.1:8000/puntos'
        )

        if (!respuesta.ok) {
          throw new Error(
            'No se pudieron cargar los puntos'
          )
        }

        const datos = await respuesta.json()

        setPuntos(datos)
      } catch (error) {
        console.error(error)
        setError(
          'No se pudieron cargar los puntos'
        )
      } finally {
        setCargando(false)
      }
    }

    cargarPuntos()
  }, [])

  const cerrarSesion = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  const irAlMapa = () => {
    navigate('/mapa')
  }

  const irAAgregarPunto = () => {
    navigate('/mapa')
  }

  const irAAdministracion = () => {
    navigate('/admin')
  }

  return (
    <div className="home-page">

      <header className="home-header">

        <div>
          <h1>eco-TRACE</h1>
          <p>Conecta, recicla y transforma</p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >

          <button
            type="button"
            className="primary-button"
            onClick={irAlMapa}
          >
            🗺️ Mapa
          </button>

          {esAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={irAAdministracion}
            >
              👑 Administración
            </button>
          )}

          <button
            type="button"
            className="logout-button"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>

        </div>

      </header>

      <main className="home-main">

        <section className="welcome-section">

          <h2>
            Bienvenido a eco-TRACE 🌱
          </h2>

          <p>
            Encuentra y comparte puntos de reciclaje,
            donación de ropa y reciclaje electrónico.
          </p>

        </section>

        <section className="options-section">

          <div className="option-card">

            <div className="option-icon">
              🗺️
            </div>

            <h3>
              Explorar mapa
            </h3>

            <p>
              Encuentra puntos de reciclaje y donación
              cerca de ti.
            </p>

            <button
            className="primary-button"
            onClick={() => navigate('/mapa')}
            >
              Ver mapa
              </button>

          </div>

          <div className="option-card">

            <div className="option-icon">
              ➕
            </div>

            <h3>
              Agregar punto
            </h3>

            <p>
              Comparte un nuevo punto para ayudar
              a la comunidad.
            </p>

            <button
            className="primary-button"
            onClick={() => navigate('/mapa')}
            >
              Agregar punto
              </button>

          </div>

          <div className="option-card">

            <div className="option-icon">
              ♻️
            </div>

            <h3>
              Reciclaje
            </h3>

            <p>
              Consulta lugares donde puedes reciclar
              diferentes materiales.
            </p>

            <button
            className="primary-button"
            onClick={() => navigate('/mapa')}
            >
              Explorar
              </button>

          </div>

        </section>

        {esAdmin && (
          <section className="option-card">
            <div className="option-icon">
              👑
            </div>

            <h3>
              Administración
            </h3>

            <p>
              Revisa y administra los puntos enviados
              por los usuarios.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={irAAdministracion}
            >
              Ir al panel
            </button>
          </section>
        )}

        <section className="points-section">

          <h2>
            Puntos disponibles
          </h2>

          {cargando && (
            <p className="points-message">
              Cargando puntos...
            </p>
          )}

          {error && (
            <p className="points-error">
              {error}
            </p>
          )}

          {!cargando &&
            !error &&
            puntos.length === 0 && (
              <p className="points-message">
                No hay puntos disponibles todavía.
              </p>
            )}

          {!cargando &&
            !error &&
            puntos.length > 0 && (

              <div className="points-grid">

                {puntos.map((punto) => (

                  <div
                    className="point-card"
                    key={punto.id}
                  >

                    <div className="point-icon">
                      ♻️
                    </div>

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

                ))}

              </div>
            )}

        </section>

      </main>

    </div>
  )
}

export default Home

