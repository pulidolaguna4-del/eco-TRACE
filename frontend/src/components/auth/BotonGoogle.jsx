// =========================================================
// BOTÓN "INICIAR SESIÓN / REGISTRARSE CON GOOGLE"
// =========================================================
// Usa Google Identity Services: carga el script oficial y dibuja el
// botón de Google (sus normas de marca piden usar ese botón). Al elegir
// una cuenta, Google entrega un ID token (`credential`) que se envía al
// backend; el backend lo verifica y responde con el token de eco-TRACE.
// El mismo flujo sirve para entrar y para crear la cuenta.
//
// Necesita VITE_GOOGLE_CLIENT_ID (el Client ID "Aplicación web" de
// Google Cloud). Sin él, el botón no se muestra.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { API_URL } from '../../../config'
import { useTheme } from '../../context/ThemeContext'
import { formatearMensajeError } from '../../utils/puntoUtils'
import { MensajeFormulario } from './PiezasFormulario'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const URL_SCRIPT = 'https://accounts.google.com/gsi/client'

// El script se carga una sola vez aunque haya varios botones
let promesaScript = null

function cargarScriptGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve()

  promesaScript ??= new Promise((resolver, rechazar) => {
    const script = document.createElement('script')
    script.src = URL_SCRIPT
    script.async = true
    script.onload = resolver
    script.onerror = () => {
      promesaScript = null
      rechazar(new Error('No se pudo cargar el script de Google'))
    }
    document.head.appendChild(script)
  })

  return promesaScript
}

function BotonGoogle({ modo = 'login' }) {
  const navigate = useNavigate()
  const { tema } = useTheme()
  const refContenedor = useRef(null)

  const [estado, setEstado] = useState('cargando') // cargando | listo | error | procesando
  const [mensaje, setMensaje] = useState('')

  // Google llama a esta función con el ID token de la cuenta elegida
  const alElegirCuenta = async ({ credential }) => {
    setEstado('procesando')
    setMensaje('')

    try {
      const respuesta = await fetch(`${API_URL}/usuarios/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      })
      const datos = await respuesta.json().catch(() => null)

      if (!respuesta.ok) {
        throw new Error(formatearMensajeError(datos?.detail, 'No se pudo iniciar sesión con Google'))
      }

      localStorage.setItem('access_token', datos.access_token)
      localStorage.setItem('usuario', JSON.stringify(datos.usuario))

      navigate('/home')
    } catch (error) {
      console.error(error)
      setMensaje(error.message === 'Failed to fetch' ? 'No se pudo conectar con el servidor' : error.message)
      setEstado('listo')
    }
  }

  // Cargar el script y dibujar el botón (de nuevo si cambia el tema)
  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelado = false

    cargarScriptGoogle()
      .then(() => {
        if (cancelado || !refContenedor.current) return

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: alElegirCuenta,
          ux_mode: 'popup',
          context: modo === 'registro' ? 'signup' : 'signin'
        })

        const ancho = Math.round(refContenedor.current.offsetWidth)
        refContenedor.current.innerHTML = ''
        window.google.accounts.id.renderButton(refContenedor.current, {
          type: 'standard',
          theme: tema === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'rectangular',
          text: modo === 'registro' ? 'signup_with' : 'signin_with',
          logo_alignment: 'center',
          locale: 'es',
          // Google acepta entre 200 y 400 px
          width: Math.min(400, Math.max(200, ancho))
        })

        setEstado('listo')
      })
      .catch((error) => {
        console.error(error)
        if (!cancelado) setEstado('error')
      })

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, modo])

  // Sin Client ID no hay botón (en desarrollo se avisa qué falta)
  if (!CLIENT_ID) {
    return import.meta.env.DEV ? (
      <p className="text-xs text-center text-gray-500 dark:text-[#a8b3ae] border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-3">
        Para mostrar el botón de Google, define <code>VITE_GOOGLE_CLIENT_ID</code>.
      </p>
    ) : null
  }

  return (
    <div>
      <div className="relative flex justify-center min-h-11">
        {/* Aquí Google dibuja su botón */}
        <div ref={refContenedor} className="w-full flex justify-center" />

        {estado === 'cargando' && (
          <div className="absolute inset-0 rounded-md bg-gray-100 dark:bg-gray-800/70 animate-pulse" aria-hidden="true" />
        )}

        {estado === 'procesando' && (
          <div
            className="absolute inset-0 rounded-md bg-white/85 dark:bg-[#0f1512]/85 flex items-center justify-center gap-2 text-sm font-bold text-gray-700 dark:text-[#dce4e0]"
            role="status"
          >
            <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-hidden="true" />
            Entrando con Google...
          </div>
        )}
      </div>

      {estado === 'error' && (
        <p className="mt-2 text-xs text-center text-gray-500 dark:text-[#a8b3ae]">
          No se pudo cargar el botón de Google. Revisa tu conexión o usa tu correo.
        </p>
      )}

      <MensajeFormulario mensaje={mensaje} esError />
    </div>
  )
}

export default BotonGoogle
