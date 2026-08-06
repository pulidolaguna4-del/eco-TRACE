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

  const manejarRegistro = (e) => {
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

    setError('')
    setMensaje('Registro válido. ¡Cuenta lista para crear!')
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