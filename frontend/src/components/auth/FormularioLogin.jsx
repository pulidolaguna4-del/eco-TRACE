import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../../config'
import { claseBotonPrincipal, claseCampo, claseEnlace, claseEtiqueta } from './estilos'
import {
  BotonEnviar,
  CampoContrasena,
  EnlaceSecundario,
  MensajeFormulario,
  Separador
} from './PiezasFormulario'

const CLAVE_CORREO_RECORDADO = 'correo_recordado'

function leerCorreoRecordado() {
  try {
    return localStorage.getItem(CLAVE_CORREO_RECORDADO) || ''
  } catch {
    return ''
  }
}

function FormularioLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefiereReducido = useReducedMotion()

  // Si viene de crear una cuenta, llega con el correo listo
  const correoRegistrado = location.state?.correoRegistrado

  const [correo, setCorreo] = useState(() => correoRegistrado || leerCorreoRecordado())
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(() => leerCorreoRecordado() !== '')
  const [mensaje, setMensaje] = useState(
    correoRegistrado ? '¡Cuenta creada! Ahora inicia sesión con tu contraseña.' : ''
  )
  const [esError, setEsError] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [intentosErroneos, setIntentosErroneos] = useState(0)

  // El aviso de "cuenta creada" se muestra una vez: se limpia del historial
  // para que no vuelva a salir al recargar la página
  useEffect(() => {
    if (correoRegistrado) {
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMensaje('')
    setEsError(false)

    // Validación de campos vacíos
    if (!correo.trim() || !password.trim()) {
      setMensaje('Por favor completa todos los campos')
      setEsError(true)
      setIntentosErroneos((prev) => prev + 1)
      return
    }

    setCargando(true)

    try {
      // =====================================================
      // LOGIN
      // =====================================================
      const respuesta = await fetch(`${API_URL}/usuarios/login`, {
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
        setEsError(true)
        setIntentosErroneos((prev) => prev + 1)
        setCargando(false)
        return
      }

      // =====================================================
      // GUARDAR TOKEN
      // =====================================================
      localStorage.setItem('access_token', datos.access_token)

      // =====================================================
      // OBTENER USUARIO REAL
      // =====================================================
      const respuestaUsuario = await fetch(`${API_URL}/usuarios/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${datos.access_token}`
        }
      })

      const usuario = await respuestaUsuario.json()

      if (!respuestaUsuario.ok) {
        localStorage.removeItem('access_token')
        setMensaje(usuario.detail || 'No se pudo obtener la información del usuario')
        setEsError(true)
        setIntentosErroneos((prev) => prev + 1)
        setCargando(false)
        return
      }

      // =====================================================
      // GUARDAR USUARIO (Y EL CORREO SI PIDIÓ RECORDARLO)
      // =====================================================
      localStorage.setItem('usuario', JSON.stringify(usuario))

      try {
        if (recordar) localStorage.setItem(CLAVE_CORREO_RECORDADO, correo.trim())
        else localStorage.removeItem(CLAVE_CORREO_RECORDADO)
      } catch {
        // Sin almacenamiento disponible: no pasa nada
      }

      setMensaje('¡Inicio de sesión exitoso!')
      setEsError(false)

      // Ir al home
      navigate('/home')

    } catch (error) {
      console.error(error)
      setMensaje('No se pudo conectar con el servidor')
      setEsError(true)
      setIntentosErroneos((prev) => prev + 1)
    } finally {
      setCargando(false)
    }
  }

  // Sacudida al fallar
  const shakeVariantes = {
    normal: { x: 0 },
    shake: {
      x: prefiereReducido ? 0 : [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.4, ease: 'easeInOut' }
    }
  }

  return (
    <motion.div
      key={intentosErroneos}
      variants={shakeVariantes}
      animate={intentosErroneos > 0 ? 'shake' : 'normal'}
    >
      {/* ENCABEZADO */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
          Iniciar sesión
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-2">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className={claseEnlace}>
            Crear cuenta
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className={claseEtiqueta}>
            Correo electrónico
          </label>
          <input
            type="email"
            id="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className={claseCampo}
          />
        </div>

        <div>
          <label htmlFor="password" className={claseEtiqueta}>
            Contraseña
          </label>
          <CampoContrasena
            id="password"
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-[#a8b3ae] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recordar}
              onChange={(e) => setRecordar(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-[#218739] cursor-pointer"
            />
            Recordar mi correo
          </label>

          <Link to="/recuperar-password" className={`text-xs ${claseEnlace}`}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <BotonEnviar
          cargando={cargando}
          texto="Iniciar sesión"
          textoCargando="Iniciando sesión..."
          className={claseBotonPrincipal}
        />
      </form>

      <MensajeFormulario mensaje={mensaje} esError={esError} />

      <Separador />

      <div className="space-y-3">
        <EnlaceSecundario to="/mapa" icono="🗺️">
          Explorar el mapa sin cuenta
        </EnlaceSecundario>
        <EnlaceSecundario to="/impacto" icono="📊">
          Ver el impacto de la comunidad
        </EnlaceSecundario>
      </div>
    </motion.div>
  )
}

export default FormularioLogin
