import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Register.css'

function Register() {
  const [formulario, setFormulario] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const manejarCambio = (e) => {
    const { id, value } = e.target

    setFormulario({
      ...formulario,
      [id]: value
    })

    setError('')
    setMensaje('')
  }

  const manejarRegistro = async (e) => {
    e.preventDefault()

    const { name, email, password, confirmPassword } = formulario

    if (!name || !email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (!email.includes('@')) {
      setError('Ingresa un correo electrónico válido')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      const respuesta = await fetch(
        'http://127.0.0.1:8000/usuarios/registro',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: name,
            correo: email,
            password: password
          })
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        setError(datos.detail || 'No se pudo crear la cuenta')
        return
      }

      setError('')
      setMensaje(
        '¡Cuenta creada correctamente! Ya puedes iniciar sesión.'
      )

      setFormulario({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      })

    } catch (error) {
      console.error(error)
      setError('No se pudo conectar con el servidor')
    }
  }

  return (
    <div className="register-container">

      <div className="register-card">

        <div className="register-header">
          <h1>eco-TRACE</h1>
          <p>Crea tu cuenta</p>
        </div>

        <form onSubmit={manejarRegistro}>

          <div className="form-group">
            <label htmlFor="name">
              Nombre completo
            </label>

            <input
              type="text"
              id="name"
              placeholder="Ingresa tu nombre"
              value={formulario.name}
              onChange={manejarCambio}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <input
              type="email"
              id="email"
              placeholder="Ingresa tu correo"
              value={formulario.email}
              onChange={manejarCambio}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              type="password"
              id="password"
              placeholder="Crea una contraseña"
              value={formulario.password}
              onChange={manejarCambio}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirmar contraseña
            </label>

            <input
              type="password"
              id="confirmPassword"
              placeholder="Repite tu contraseña"
              value={formulario.confirmPassword}
              onChange={manejarCambio}
            />
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="success-message">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            className="register-button"
          >
            Crear cuenta
          </button>

        </form>

        <div className="login-link">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login">
              Iniciar sesión
            </Link>
          </p>
        </div>

      </div>

    </div>
  )
}

export default Register

