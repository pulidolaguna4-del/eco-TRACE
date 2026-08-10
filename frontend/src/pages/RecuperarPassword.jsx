import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RecuperarPassword.css'

function RecuperarPassword() {
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1)

  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')

  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const API_URL = 'http://127.0.0.1:8000'

  // =====================================================
  // PASO 1 - ENVIAR CÓDIGO
  // =====================================================

  const enviarCodigo = async (e) => {
    e.preventDefault()

    setMensaje('')
    setError('')

    if (!correo) {
      setError('Ingresa tu correo electrónico')
      return
    }

    try {
      setCargando(true)

      const respuesta = await fetch(
        `${API_URL}/usuarios/recuperar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            correo
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || 'No se pudo enviar el código'
        )
      }

      setMensaje(
        'Código enviado. Revisa tu correo electrónico.'
      )

      setPaso(2)

    } catch (error) {

      setError(error.message)

    } finally {

      setCargando(false)
    }
  }

  // =====================================================
  // PASO 2 - VERIFICAR CÓDIGO
  // =====================================================

  const verificarCodigo = async (e) => {
    e.preventDefault()

    setMensaje('')
    setError('')

    if (!codigo) {
      setError('Ingresa el código recibido')
      return
    }

    try {

      setCargando(true)

      const respuesta = await fetch(
        `${API_URL}/usuarios/verificar-codigo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            correo,
            codigo
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || 'Código incorrecto'
        )
      }

      setMensaje('Código correcto.')

      setPaso(3)

    } catch (error) {

      setError(error.message)

    } finally {

      setCargando(false)
    }
  }

  // =====================================================
  // PASO 3 - CAMBIAR CONTRASEÑA
  // =====================================================

  const cambiarPassword = async (e) => {
    e.preventDefault()

    setMensaje('')
    setError('')

    if (!nuevaPassword || !confirmarPassword) {
      setError('Completa todos los campos')
      return
    }

    if (nuevaPassword.length < 6) {
      setError(
        'La contraseña debe tener mínimo 6 caracteres'
      )
      return
    }

    if (nuevaPassword !== confirmarPassword) {
      setError(
        'Las contraseñas no coinciden'
      )
      return
    }

    try {

      setCargando(true)

      const respuesta = await fetch(
        `${API_URL}/usuarios/nueva-contrasena`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            correo,
            codigo,
            nueva_password: nuevaPassword
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || 'No se pudo cambiar la contraseña'
        )
      }

      setMensaje(
        'Contraseña actualizada correctamente.'
      )

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {

      setError(error.message)

    } finally {

      setCargando(false)
    }
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <div className="recuperar-container">

      <div className="recuperar-card">

        <div className="recuperar-header">

          <h1>Eco-TRACE</h1>

          <p>
            Recuperación de contraseña
          </p>

        </div>


        {/* =================================================
            PASO 1
        ================================================= */}

        {paso === 1 && (

          <form onSubmit={enviarCodigo}>

            <h2>¿Olvidaste tu contraseña?</h2>

            <p className="descripcion">
              Ingresa tu correo y te enviaremos
              un código de recuperación.
            </p>

            <label>
              Correo electrónico
            </label>

            <input
              type="email"
              value={correo}
              onChange={(e) =>
                setCorreo(e.target.value)
              }
              placeholder="correo@gmail.com"
            />

            <button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? 'Enviando...'
                : 'Enviar código'}
            </button>

          </form>

        )}


        {/* =================================================
            PASO 2
        ================================================= */}

        {paso === 2 && (

          <form onSubmit={verificarCodigo}>

            <h2>Verificar código</h2>

            <p className="descripcion">
              Hemos enviado un código de 6 dígitos
              a:
            </p>

            <strong>
              {correo}
            </strong>

            <label>
              Código de recuperación
            </label>

            <input
              type="text"
              maxLength="6"
              value={codigo}
              onChange={(e) =>
                setCodigo(
                  e.target.value.replace(/\D/g, '')
                )
              }
              placeholder="000000"
            />

            <button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? 'Verificando...'
                : 'Verificar código'}
            </button>

            <button
              type="button"
              className="boton-secundario"
              onClick={() => {
                setPaso(1)
                setCodigo('')
              }}
            >
              Cambiar correo
            </button>

          </form>

        )}


        {/* =================================================
            PASO 3
        ================================================= */}

        {paso === 3 && (

          <form onSubmit={cambiarPassword}>

            <h2>Nueva contraseña</h2>

            <p className="descripcion">
              Crea una nueva contraseña para
              tu cuenta.
            </p>

            <label>
              Nueva contraseña
            </label>

            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) =>
                setNuevaPassword(
                  e.target.value
                )
              }
              placeholder="Nueva contraseña"
            />

            <label>
              Confirmar contraseña
            </label>

            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) =>
                setConfirmarPassword(
                  e.target.value
                )
              }
              placeholder="Repite la contraseña"
            />

            <button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? 'Guardando...'
                : 'Cambiar contraseña'}
            </button>

          </form>

        )}


        {/* =================================================
            MENSAJES
        ================================================= */}

        {mensaje && (
          <div className="mensaje-exito">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mensaje-error">
            {error}
          </div>
        )}


        {/* =================================================
            VOLVER AL LOGIN
        ================================================= */}

        <button
          type="button"
          className="volver-login"
          onClick={() => navigate('/login')}
        >
          ← Volver al inicio de sesión
        </button>

      </div>

    </div>
  )
}

export default RecuperarPassword