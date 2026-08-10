import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        const respuesta = await fetch(
          'http://127.0.0.1:8000/puntos'
        )

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los puntos')
        }

        const datos = await respuesta.json()

        setPuntos(datos)
      } catch (error) {
        console.error(error)
        setError('No se pudieron cargar los puntos')
      } finally {
        setCargando(false)
      }
    }

    cargarPuntos()
  }, [])

  return (
    <main className="home-main">

      {/* Bienvenida */}
      <section className="welcome-section">

        <h2>
          Bienvenido a eco-TRACE 🌱
        </h2>

        <p>
          Encuentra y comparte puntos de reciclaje,
          donación de ropa y reciclaje electrónico.
        </p>

      </section>


      {/* Opciones principales */}
      <section className="options-section">

        {/* MAPA */}
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


        {/* AGREGAR PUNTO */}
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
            onClick={() => navigate('/agregar-punto')}
          >
            Agregar punto
          </button>

        </div>


        {/* RECICLAJE */}
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


      {/* PUNTOS DISPONIBLES */}
      <section className="points-section">

        <h2>
          Puntos disponibles
        </h2>


        {/* Cargando */}
        {cargando && (
          <p className="points-message">
            Cargando puntos...
          </p>
        )}


        {/* Error */}
        {error && (
          <p className="points-error">
            {error}
          </p>
        )}


        {/* Sin puntos */}
        {!cargando &&
          !error &&
          puntos.length === 0 && (
            <p className="points-message">
              No hay puntos disponibles todavía.
            </p>
          )}


        {/* Lista de puntos */}
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
  )
}

export default Home

