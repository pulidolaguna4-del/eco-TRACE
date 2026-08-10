import './Login.css'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

function Login() {
  const navigate = useNavigate()

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMensaje('')

    // Validación de campos vacíos
    if (!correo.trim() || !password.trim()) {
      setMensaje('Por favor completa todos los campos')
      return
    }

    setCargando(true)

    try {
      const respuesta = await fetch('http://127.0.0.1:8000/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: correo,
          password: password
        })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setMensaje(datos.detail || 'Correo o contraseña incorrectos')
        return
      }

      localStorage.setItem('access_token', datos.access_token)

      setMensaje('Inicio de sesión exitoso')

      navigate('/')
    } catch (error) {
      console.error(error)
      setMensaje('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-container">

      <div className="login-card">

        <div className="login-header">
          <h1>eco-TRACE</h1>
          <p>Conecta, recicla y transforma</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>

            <input
              type="email"
              id="email"
              placeholder="Ingresa tu correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <input
              type="password"
              id="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot-password">
            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

        </form>

        {mensaje && (
          <p className="login-message">
            {mensaje}
          </p>
        )}

        <div className="register">
          <p>
            ¿No tienes una cuenta?{' '}
            <Link to="/register">Crear cuenta</Link>
          </p>
        </div>

      </div>

    </div>
  )
}

export default Login