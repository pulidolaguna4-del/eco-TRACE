import './Login.css'
import { Link } from 'react-router-dom'

function Login() {
  return (
    <div className="login-container">

      <div className="login-card">

        <div className="login-header">
          <h1>eco-TRACE</h1>
          <p>Conecta, recicla y transforma</p>
        </div>

        <form>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="Ingresa tu correo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <div className="forgot-password">
            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>
        </form>

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