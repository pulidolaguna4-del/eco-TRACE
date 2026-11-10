import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const MINIMO_CONTRASENA = 6

const VACIO = {
  nombre: '',
  correo: '',
  password: '',
  confirmarPassword: ''
}

function FormularioRegistro() {
  const navigate = useNavigate()
  const prefiereReducido = useReducedMotion()

  const [formulario, setFormulario] = useState(VACIO)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [intentosErroneos, setIntentosErroneos] = useState(0)

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setFormulario((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const fallar = (mensaje) => {
    setError(mensaje)
    setIntentosErroneos((prev) => prev + 1)
  }

  const manejarRegistro = async (e) => {
    e.preventDefault()

    const nombre = formulario.nombre.trim()
    const correo = formulario.correo.trim()
    const { password, confirmarPassword } = formulario

    if (!nombre || !correo || !password || !confirmarPassword) {
      fallar('Todos los campos son obligatorios')
      return
    }

    if (!correo.includes('@')) {
      fallar('Ingresa un correo electrónico válido')
      return
    }

    if (password.length < MINIMO_CONTRASENA) {
      fallar(`La contraseña debe tener mínimo ${MINIMO_CONTRASENA} caracteres`)
      return
    }

    if (password !== confirmarPassword) {
      fallar('Las contraseñas no coinciden')
      return
    }

    try {
      setCargando(true)

      const respuesta = await fetch(`${API_URL}/usuarios/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, correo, password })
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        fallar(datos.detail || 'No se pudo crear la cuenta')
        return
      }

      setFormulario(VACIO)

      // Vuelve al inicio de sesión (los paneles se deslizan de regreso)
      // con el correo listo para entrar
      navigate('/login', { state: { correoRegistrado: correo } })
    } catch (err) {
      console.error(err)
      fallar('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  const shakeVariantes = {
    normal: { x: 0 },
    shake: {
      x: prefiereReducido ? 0 : [0, -10, 10, -8, 8, -4, 4, 0],
      transition: { duration: 0.4, ease: 'easeInOut' }
    }
  }

  const contrasenaCorta =
    formulario.password.length > 0 && formulario.password.length < MINIMO_CONTRASENA

  const noCoinciden =
    formulario.confirmarPassword.length > 0 &&
    formulario.confirmarPassword !== formulario.password

  return (
    <motion.div
      key={intentosErroneos}
      variants={shakeVariantes}
      animate={intentosErroneos > 0 ? 'shake' : 'normal'}
    >
      {/* ENCABEZADO */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
          Crear cuenta
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-2">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className={claseEnlace}>
            Iniciar sesión
          </Link>
        </p>
      </div>

      <form onSubmit={manejarRegistro} noValidate className="space-y-5">
        <div>
          <label htmlFor="nombre" className={claseEtiqueta}>
            Nombre completo
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            autoComplete="name"
            placeholder="¿Cómo te llamas?"
            value={formulario.nombre}
            onChange={manejarCambio}
            className={claseCampo}
          />
        </div>

        <div>
          <label htmlFor="correo-registro" className={claseEtiqueta}>
            Correo electrónico
          </label>
          <input
            type="email"
            id="correo-registro"
            name="correo"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            value={formulario.correo}
            onChange={manejarCambio}
            className={claseCampo}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="password-registro" className={claseEtiqueta}>
              Contraseña
            </label>
            <CampoContrasena
              id="password-registro"
              autoComplete="new-password"
              placeholder="Crea una contraseña"
              value={formulario.password}
              onChange={(e) => manejarCambio({ target: { name: 'password', value: e.target.value } })}
            />
            <p className={`text-[11px] mt-1.5 ${contrasenaCorta ? 'text-[#d93025] dark:text-[#ef5350] font-bold' : 'text-gray-400'}`}>
              Mínimo {MINIMO_CONTRASENA} caracteres
            </p>
          </div>

          <div>
            <label htmlFor="confirmar-registro" className={claseEtiqueta}>
              Confirmar contraseña
            </label>
            <CampoContrasena
              id="confirmar-registro"
              autoComplete="new-password"
              placeholder="Repítela"
              value={formulario.confirmarPassword}
              onChange={(e) => manejarCambio({ target: { name: 'confirmarPassword', value: e.target.value } })}
            />
            {noCoinciden && (
              <p className="text-[11px] mt-1.5 text-[#d93025] dark:text-[#ef5350] font-bold">
                No coinciden
              </p>
            )}
          </div>
        </div>

        <BotonEnviar
          cargando={cargando}
          texto="Crear mi cuenta"
          textoCargando="Creando tu cuenta..."
          className={claseBotonPrincipal}
        />
      </form>

      <MensajeFormulario mensaje={error} esError />

      <Separador />

      <EnlaceSecundario to="/mapa" icono="🗺️">
        Explorar el mapa sin cuenta
      </EnlaceSecundario>
    </motion.div>
  )
}

export default FormularioRegistro
