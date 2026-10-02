import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Perfil.css'

function Perfil() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(null)

  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')

  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')

  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // =========================================================
  // OBTENER USUARIO
  // =========================================================
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const token = localStorage.getItem('access_token')

        if (!token) {
          setError('No se encontró la sesión del usuario.')
          setCargando(false)
          return
        }

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
          if (respuesta.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('usuario')
          }

          setError(
            datos.detail ||
              'No se pudo obtener la información del usuario.'
          )

          setCargando(false)
          return
        }

        setUsuario(datos)
        setNombre(datos.nombre || '')
        setCorreo(datos.correo || '')

        // Mantener actualizado el usuario guardado localmente
        localStorage.setItem('usuario', JSON.stringify(datos))

        setCargando(false)
      } catch (err) {
        console.error(err)
        setError('No se pudo conectar con el servidor.')
        setCargando(false)
      }
    }

    cargarUsuario()
  }, [])

  // =========================================================
  // GUARDAR CAMBIOS
  // =========================================================
  const guardarCambios = async (e) => {
    e.preventDefault()

    setMensaje('')
    setError('')

    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('No se encontró la sesión del usuario.')
      return
    }

    // Validar nombre y correo
    if (!nombre.trim() || !correo.trim()) {
      setError('El nombre y el correo son obligatorios.')
      return
    }

    // =======================================================
    // VALIDAR CONTRASEÑA
    // =======================================================
    const quiereCambiarPassword =
      passwordActual.trim() ||
      nuevaPassword.trim() ||
      confirmarPassword.trim()

    if (quiereCambiarPassword) {
      if (
        !passwordActual.trim() ||
        !nuevaPassword.trim() ||
        !confirmarPassword.trim()
      ) {
        setError(
          'Para cambiar la contraseña debes completar todos los campos.'
        )
        return
      }

      if (nuevaPassword.length < 8) {
        setError(
          'La nueva contraseña debe tener mínimo 8 caracteres.'
        )
        return
      }

      if (nuevaPassword !== confirmarPassword) {
        setError('Las nuevas contraseñas no coinciden.')
        return
      }
    }

    setGuardando(true)

    try {
      // =======================================================
      // ACTUALIZAR PERFIL
      // =======================================================
      const respuestaPerfil = await fetch(
        'http://127.0.0.1:8000/usuarios/me',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            correo: correo.trim()
          })
        }
      )

      const datosPerfil = await respuestaPerfil.json()

      if (!respuestaPerfil.ok) {
        setError(
          datosPerfil.detail ||
            'No se pudieron actualizar los datos del perfil.'
        )
        setGuardando(false)
        return
      }

      // =======================================================
      // CAMBIAR CONTRASEÑA SI EL USUARIO LO SOLICITÓ
      // =======================================================
      if (quiereCambiarPassword) {
        const respuestaPassword = await fetch(
          'http://127.0.0.1:8000/usuarios/me/contrasena',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              password_actual: passwordActual,
              nueva_password: nuevaPassword
            })
          }
        )

        const datosPassword = await respuestaPassword.json()

        if (!respuestaPassword.ok) {
          setError(
            datosPassword.detail ||
              'No se pudo cambiar la contraseña.'
          )
          setGuardando(false)
          return
        }
      }

      // =======================================================
      // ACTUALIZAR DATOS LOCALES
      // =======================================================
      const usuarioActualizado = {
        ...usuario,
        nombre: nombre.trim(),
        correo: correo.trim()
      }

      setUsuario(usuarioActualizado)

      localStorage.setItem(
        'usuario',
        JSON.stringify(usuarioActualizado)
      )

      // Limpiar campos de contraseña
      setPasswordActual('')
      setNuevaPassword('')
      setConfirmarPassword('')

      setMensaje(
        quiereCambiarPassword
          ? 'Perfil y contraseña actualizados correctamente.'
          : 'Perfil actualizado correctamente.'
      )

      setEditando(false)
    } catch (err) {
      console.error(err)
      setError('No se pudo conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  // =========================================================
  // CANCELAR EDICIÓN
  // =========================================================
  const cancelarEdicion = () => {
    setNombre(usuario?.nombre || '')
    setCorreo(usuario?.correo || '')

    setPasswordActual('')
    setNuevaPassword('')
    setConfirmarPassword('')

    setMensaje('')
    setError('')

    setEditando(false)
  }

  // =========================================================
  // CARGANDO
  // =========================================================
  if (cargando) {
    return (
      <div className="perfil-page">
        <div className="perfil-loading">
          <div className="perfil-spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================
  if (error && !usuario) {
    return (
      <div className="perfil-page">
        <div className="perfil-error">
          <div className="perfil-error-icon">⚠️</div>

          <h2>No se pudo cargar el perfil</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="perfil-button perfil-button-primary"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  // =========================================================
  // PERFIL
  // =========================================================
  return (
    <div className="perfil-page">

      {/* =====================================================
          ENCABEZADO
      ===================================================== */}
      <div className="perfil-banner">
        <div className="perfil-header">

          <div className="perfil-avatar">
            {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
          </div>

          <div className="perfil-header-info">
            <h1>{usuario?.nombre || 'Usuario'}</h1>

            <span className="perfil-rol">
              {usuario?.es_admin ? '👑 Administrador' : '👤 Usuario'}
            </span>
          </div>

        </div>
      </div>

      {/* =====================================================
          CONTENIDO
      ===================================================== */}
      <div className="perfil-body">

        {/* MENSAJES */}
        {mensaje && (
          <div className="perfil-message perfil-message-success">
            <span>✅</span>
            <span>{mensaje}</span>
          </div>
        )}

        {error && usuario && (
          <div className="perfil-message perfil-message-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ===================================================
            MODO NORMAL
        =================================================== */}
        {!editando && (
          <>
            <div className="perfil-info">

              <div className="perfil-item">
                <span className="perfil-item-label">
                  Nombre
                </span>

                <strong>
                  {usuario?.nombre || 'No registrado'}
                </strong>
              </div>

              <div className="perfil-item">
                <span className="perfil-item-label">
                  Correo electrónico
                </span>

                <strong>
                  {usuario?.correo || 'No registrado'}
                </strong>
              </div>

              <div className="perfil-item">
                <span className="perfil-item-label">
                  Tipo de cuenta
                </span>

                <strong>
                  {usuario?.es_admin
                    ? 'Administrador'
                    : 'Usuario'}
                </strong>
              </div>

            </div>

            {/* BOTÓN EDITAR */}
            <div className="perfil-actions">
              <button
                type="button"
                onClick={() => {
                  setMensaje('')
                  setError('')
                  setEditando(true)
                }}
                className="perfil-button perfil-button-primary"
              >
                ✏️ Editar perfil
              </button>
            </div>
          </>
        )}

        {/* ===================================================
            MODO EDICIÓN
        =================================================== */}
        {editando && (
          <form
            className="perfil-form"
            onSubmit={guardarCambios}
          >

            <div className="perfil-section-heading">
              <div>
                <h2>Editar perfil</h2>
                <p>
                  Actualiza tus datos personales y,
                  si quieres, cambia tu contraseña.
                </p>
              </div>
            </div>

            {/* NOMBRE */}
            <div className="form-group">
              <label htmlFor="perfil-nombre">
                Nombre
              </label>

              <input
                id="perfil-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
              />
            </div>

            {/* CORREO */}
            <div className="form-group">
              <label htmlFor="perfil-correo">
                Correo electrónico
              </label>

              <input
                id="perfil-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Tu correo electrónico"
              />
            </div>

            {/* =================================================
                CAMBIO DE CONTRASEÑA
            ================================================= */}
            <div className="perfil-security-card">

              <div className="perfil-section-heading">
                <div>
                  <h2>🔐 Cambiar contraseña</h2>
                  <p>
                    Déjalos vacíos si no deseas cambiar
                    tu contraseña.
                  </p>
                </div>
              </div>

              <div className="perfil-password-options">

                <div className="form-group">
                  <label htmlFor="password-actual">
                    Contraseña actual
                  </label>

                  <input
                    id="password-actual"
                    type="password"
                    value={passwordActual}
                    onChange={(e) =>
                      setPasswordActual(e.target.value)
                    }
                    placeholder="Tu contraseña actual"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nueva-password">
                    Nueva contraseña
                  </label>

                  <input
                    id="nueva-password"
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) =>
                      setNuevaPassword(e.target.value)
                    }
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmar-password">
                    Confirmar nueva contraseña
                  </label>

                  <input
                    id="confirmar-password"
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) =>
                      setConfirmarPassword(e.target.value)
                    }
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

              </div>
            </div>

            {/* BOTONES */}
            <div className="perfil-actions">

              <button
                type="submit"
                disabled={guardando}
                className="perfil-button perfil-button-primary"
              >
                {guardando
                  ? 'Guardando...'
                  : '💾 Guardar cambios'}
              </button>

              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardando}
                className="perfil-button perfil-button-secondary"
              >
                Cancelar
              </button>

            </div>

          </form>
        )}

        {/* =====================================================
            ACCIONES RÁPIDAS
        ===================================================== */}
        <div className="perfil-shortcuts">

          <button
            type="button"
            onClick={() => navigate('/mis-puntos')}
            className="perfil-shortcut"
          >
            <span>📍</span>
            <div>
              <strong>Mis puntos</strong>
              <small>
                Consulta los puntos que has propuesto
              </small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/mapa')}
            className="perfil-shortcut"
          >
            <span>🗺️</span>
            <div>
              <strong>Ver mapa</strong>
              <small>
                Explora los puntos ecológicos
              </small>
            </div>
          </button>

        </div>

      </div>
    </div>
  )
}

export default Perfil

