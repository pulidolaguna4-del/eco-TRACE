import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Perfil.css'

function Perfil() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')

  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // =====================================================
  // OBTENER USUARIO
  // =====================================================

  useEffect(() => {
    const obtenerPerfil = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setCargando(false)
        return
      }

      try {
        const respuesta = await fetch(
          'http://127.0.0.1:8000/usuarios/me',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const datos = await respuesta.json()

        if (!respuesta.ok) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('usuario')

          setError(
            datos.detail || 'Sesión inválida'
          )

          return
        }

        setUsuario(datos)

        setNombre(datos.nombre)
        setCorreo(datos.correo)

        // Actualizar información guardada
        localStorage.setItem(
          'usuario',
          JSON.stringify(datos)
        )

      } catch (error) {
        console.error(error)

        setError(
          'No se pudo conectar con el servidor'
        )

      } finally {
        setCargando(false)
      }
    }

    obtenerPerfil()
  }, [])

  // =====================================================
  // ACTUALIZAR PERFIL
  // =====================================================

  const actualizarPerfil = async (e) => {
    e.preventDefault()

    setGuardando(true)
    setMensaje('')
    setError('')

    const token = localStorage.getItem('access_token')

    try {
      const respuesta = await fetch(
        'http://127.0.0.1:8000/usuarios/me',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: nombre,
            correo: correo
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(
          datos.detail || 'No se pudo actualizar el perfil'
        )

        return
      }

      // Actualizar estado
      setUsuario(datos)

      setNombre(datos.nombre)
      setCorreo(datos.correo)

      // Actualizar localStorage
      localStorage.setItem(
        'usuario',
        JSON.stringify(datos)
      )

      setMensaje(
        'Perfil actualizado correctamente'
      )

      setEditando(false)

    } catch (error) {
      console.error(error)

      setError(
        'No se pudo conectar con el servidor'
      )

    } finally {
      setGuardando(false)
    }
  }

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <main className="perfil-page">

        <div className="perfil-card">

          <h2>Cargando perfil...</h2>

        </div>

      </main>
    )
  }

  // =====================================================
  // NO HAY SESIÓN
  // =====================================================

  if (!usuario) {
    return (
      <main className="perfil-page">

        <div className="perfil-card perfil-login">

          <div className="perfil-icon">
            👤
          </div>

          <h1>Sesión no iniciada</h1>

          <p>
            Debes iniciar sesión para ver tu perfil.
          </p>

          {error && (
            <p className="perfil-error">
              {error}
            </p>
          )}

          <button
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>

        </div>

      </main>
    )
  }

  // =====================================================
  // PERFIL
  // =====================================================

  return (
    <main className="perfil-page">

      <section className="perfil-card">

        {/* HEADER */}

        <div className="perfil-header">

          <div className="perfil-avatar">
            {usuario.nombre?.charAt(0).toUpperCase()}
          </div>

          <div>

            <h1>
              {usuario.nombre}
            </h1>

            <span className="perfil-rol">
              {usuario.es_admin
                ? '👑 Administrador'
                : '👤 Usuario'}
            </span>

          </div>

        </div>

        {/* MENSAJES */}

        {mensaje && (
          <div className="perfil-success">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="perfil-error">
            {error}
          </div>
        )}

        {/* INFORMACIÓN */}

        {!editando ? (

          <div className="perfil-info">

            <div className="perfil-item">

              <span>
                Nombre
              </span>

              <strong>
                {usuario.nombre}
              </strong>

            </div>

            <div className="perfil-item">

              <span>
                Correo electrónico
              </span>

              <strong>
                {usuario.correo}
              </strong>

            </div>

            <div className="perfil-item">

              <span>
                Tipo de cuenta
              </span>

              <strong>
                {usuario.es_admin
                  ? 'Administrador'
                  : 'Usuario'}
              </strong>

            </div>

          </div>

        ) : (

          <form
            className="perfil-form"
            onSubmit={actualizarPerfil}
          >

            <div className="form-group">

              <label>
                Nombre
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                required
              />

            </div>

            <div className="form-group">

              <label>
                Correo electrónico
              </label>

              <input
                type="email"
                value={correo}
                onChange={(e) =>
                  setCorreo(e.target.value)
                }
                required
              />

            </div>

            <div className="perfil-edit-actions">

              <button
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? 'Guardando...'
                  : '💾 Guardar cambios'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setNombre(usuario.nombre)
                  setCorreo(usuario.correo)
                  setEditando(false)
                  setError('')
                  setMensaje('')
                }}
              >
                Cancelar
              </button>

            </div>

          </form>

        )}

        {/* ACCIONES */}

        <div className="perfil-actions">

          {!editando && (
            <button
              onClick={() => {
                setEditando(true)
                setMensaje('')
                setError('')
              }}
            >
              ✏️ Editar perfil
            </button>
          )}

          <button
            onClick={() => navigate('/mis-puntos')}
          >
            📍 Mis puntos
          </button>

          <button
            onClick={() => navigate('/mapa')}
          >
            🗺️ Ver mapa
          </button>

        </div>

      </section>

    </main>
  )
}

export default Perfil