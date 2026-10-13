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
          A. ENCABEZADO DEL PERFIL (HERO)
      ===================================================== */}
      <div className="perfil-banner">
        {/* Glow & ambient background */}
        <div className="perfil-glow-effect" aria-hidden="true"></div>

        <div className="perfil-banner-container">
          <div className="perfil-header">

            {/* Avatar con iniciales */}
            <div className="perfil-avatar-wrapper">
              <div className="perfil-avatar">
                {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="perfil-avatar-badge" title="Cuenta activa">
                🌱
              </span>
            </div>

            {/* Info principal */}
            <div className="perfil-header-info">
              <div className="perfil-header-top">
                <span className="perfil-rol">
                  {usuario?.es_admin ? '👑 Administrador' : '👤 Usuario'}
                </span>
                <span className="perfil-badge-status">
                  <span className="perfil-status-dot"></span> Verificado
                </span>
              </div>

              <h1>{usuario?.nombre || 'Usuario'}</h1>

              <div className="perfil-header-meta">
                <span className="perfil-email-meta">
                  ✉️ {usuario?.correo || 'Sin correo'}
                </span>
                <span className="perfil-tagline">
                  • Tu espacio personal en eco-TRACE
                </span>
              </div>
            </div>

            {/* Acciones principales del encabezado */}
            <div className="perfil-header-actions">
              {!editando ? (
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
              ) : (
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="perfil-button perfil-button-secondary"
                >
                  ✖️ Cancelar edición
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENIDO PRINCIPAL
      ===================================================== */}
      <div className="perfil-body">

        {/* MENSAJES DE ESTADO */}
        {mensaje && (
          <div className="perfil-message perfil-message-success">
            <span className="perfil-message-icon">✅</span>
            <div className="perfil-message-text">{mensaje}</div>
          </div>
        )}

        {error && usuario && (
          <div className="perfil-message perfil-message-error">
            <span className="perfil-message-icon">⚠️</span>
            <div className="perfil-message-text">{error}</div>
          </div>
        )}

        {/* ===================================================
            B. PANEL DE INFORMACIÓN PERSONAL (MODO NORMAL)
        =================================================== */}
        {!editando && (
          <section className="perfil-section">
            <div className="perfil-section-header">
              <span className="perfil-section-badge">Información</span>
              <h2>Datos de tu cuenta</h2>
              <p>Resumen general de la información asociada a tu perfil ecológico.</p>
            </div>

            <div className="perfil-info-grid">

              <div className="perfil-card">
                <div className="perfil-card-icon">👤</div>
                <div className="perfil-card-content">
                  <span className="perfil-item-label">Nombre de usuario</span>
                  <strong>{usuario?.nombre || 'No registrado'}</strong>
                </div>
              </div>

              <div className="perfil-card">
                <div className="perfil-card-icon">✉️</div>
                <div className="perfil-card-content">
                  <span className="perfil-item-label">Correo electrónico</span>
                  <strong>{usuario?.correo || 'No registrado'}</strong>
                </div>
              </div>

              <div className="perfil-card">
                <div className="perfil-card-icon">🛡️</div>
                <div className="perfil-card-content">
                  <span className="perfil-item-label">Tipo de cuenta / Rol</span>
                  <strong>
                    {usuario?.es_admin ? 'Administrador del sistema' : 'Usuario comunitario'}
                  </strong>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ===================================================
            FORMULARIO MODO EDICIÓN
        =================================================== */}
        {editando && (
          <section className="perfil-section">
            <form
              className="perfil-form"
              onSubmit={guardarCambios}
            >

              <div className="perfil-section-heading">
                <div>
                  <span className="perfil-section-badge">Edición</span>
                  <h2>Editar información general</h2>
                  <p>
                    Actualiza tu nombre o correo electrónico. Los cambios se reflejarán en toda la plataforma.
                  </p>
                </div>
              </div>

              <div className="perfil-form-grid">
                {/* NOMBRE */}
                <div className="form-group">
                  <label htmlFor="perfil-nombre">
                    Nombre completo
                  </label>
                  <input
                    id="perfil-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    required
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
                    required
                  />
                </div>
              </div>

              {/* =================================================
                  D. SECCIÓN ADICIONAL DE SEGURIDAD
              ================================================= */}
              <div className="perfil-security-card">
                <div className="perfil-section-heading">
                  <div>
                    <h2>🔐 Seguridad y contraseña</h2>
                    <p>
                      Completa los siguientes campos solo si deseas cambiar tu contraseña de acceso.
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
                      onChange={(e) => setPasswordActual(e.target.value)}
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
                      onChange={(e) => setNuevaPassword(e.target.value)}
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
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                    />
                  </div>

                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="perfil-actions">
                <button
                  type="submit"
                  disabled={guardando}
                  className="perfil-button perfil-button-primary"
                >
                  {guardando ? 'Guardando...' : '💾 Guardar cambios'}
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
          </section>
        )}

        {/* =====================================================
            C. SECCIÓN DE ACCIONES RÁPIDAS
        ===================================================== */}
        <section className="perfil-section perfil-shortcuts-section">
          <div className="perfil-section-header">
            <span className="perfil-section-badge">Accesos directos</span>
            <h2>Acciones rápidas</h2>
            <p>Navega rápidamente a las principales áreas funcionales de eco-TRACE.</p>
          </div>

          <div className="perfil-shortcuts">

            {/* Mis puntos */}
            <button
              type="button"
              onClick={() => navigate('/mis-puntos')}
              className="perfil-shortcut"
            >
              <span className="perfil-shortcut-icon">📍</span>
              <div className="perfil-shortcut-text">
                <strong>Mis puntos ecológicos</strong>
                <small>Consulta y gestiona los puntos que has propuesto</small>
              </div>
              <span className="perfil-shortcut-arrow">→</span>
            </button>

            {/* Explorar mapa */}
            <button
              type="button"
              onClick={() => navigate('/mapa')}
              className="perfil-shortcut"
            >
              <span className="perfil-shortcut-icon">🗺️</span>
              <div className="perfil-shortcut-text">
                <strong>Explorar el mapa</strong>
                <small>Encuentra lugares de reciclaje en tu ciudad</small>
              </div>
              <span className="perfil-shortcut-arrow">→</span>
            </button>

            {/* Editar Perfil Toggle */}
            <button
              type="button"
              onClick={() => {
                setMensaje('')
                setError('')
                setEditando(!editando)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="perfil-shortcut"
            >
              <span className="perfil-shortcut-icon">✏️</span>
              <div className="perfil-shortcut-text">
                <strong>Editar mi perfil</strong>
                <small>Modifica tus datos o cambia tu contraseña</small>
              </div>
              <span className="perfil-shortcut-arrow">→</span>
            </button>

            {/* Panel de administración (solo para administradores) */}
            {usuario?.es_admin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="perfil-shortcut perfil-shortcut-admin"
              >
                <span className="perfil-shortcut-icon">🛡️</span>
                <div className="perfil-shortcut-text">
                  <strong>Panel de administración</strong>
                  <small>Modera solicitudes y gestiona la plataforma</small>
                </div>
                <span className="perfil-shortcut-arrow">→</span>
              </button>
            )}

          </div>
        </section>

      </div>
    </div>
  )
}

export default Perfil
