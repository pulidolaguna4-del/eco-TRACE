// =========================================================
// MI PERFIL
// =========================================================
// - Encabezado con el nombre, el correo, el rol y el método de acceso.
// - Resumen de la actividad del usuario: puntos propuestos, entregas,
//   kg reciclados y reportes (cada uno lleva a su página).
// - "Datos de la cuenta" y "Contraseña" son formularios separados.
//   Las cuentas creadas con Google no tienen contraseña: se explica cómo
//   crear una en lugar de mostrar el formulario.
// - Accesos directos a las demás secciones.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import { formatearMensajeError } from '../utils/puntoUtils'
import { CampoContrasena } from '../components/auth/PiezasFormulario'
import { claseTarjeta, claseCampo, anilloFoco, Avisos, BotonAccion, EstadoVacio } from '../components/admin/ui'
import { formatearNumero, kgDeEntrega } from '../components/admin/utilidades'

const MINIMO_CONTRASENA = 8
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const claseEtiqueta = 'block text-xs font-bold text-gray-700 dark:text-[#dce4e0] mb-1.5'

// ---------------------------------------------------------
// Piezas
// ---------------------------------------------------------

function LogoGoogle({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function Indicador({ to, icono, etiqueta, valor, detalle, cargando }) {
  return (
    <Link
      to={to}
      className={`group ${claseTarjeta} p-5 block hover:border-[#218739]/40 dark:hover:border-[#2fa350]/40 transition-colors ${anilloFoco}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">{etiqueta}</p>
        <span className="w-9 h-9 rounded-xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/10 dark:border-gray-800 flex items-center justify-center text-base" aria-hidden="true">
          {icono}
        </span>
      </div>
      {cargando ? (
        <div className="mt-3 h-9 w-16 rounded-lg bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
      ) : (
        <p className="mt-3 text-3xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">{valor}</p>
      )}
      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1 flex items-center justify-between gap-2">
        <span>{detalle}</span>
        <span className="text-gray-400 group-hover:text-[#218739] dark:group-hover:text-[#2fa350] group-hover:translate-x-0.5 transition-all" aria-hidden="true">→</span>
      </p>
    </Link>
  )
}

function Acceso({ to, icono, titulo, descripcion, destacado = false }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-4 p-4 rounded-2xl border transition-colors ${anilloFoco} ${
        destacado
          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-400'
          : 'bg-white dark:bg-[#1a2320] border-gray-100 dark:border-gray-800/60 hover:border-[#218739]/40 dark:hover:border-[#2fa350]/40'
      }`}
    >
      <span
        className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg border ${
          destacado
            ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40'
            : 'bg-[#f1f8f4] dark:bg-[#0f1512] border-[#218739]/10 dark:border-gray-800'
        }`}
        aria-hidden="true"
      >
        {icono}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-extrabold text-gray-900 dark:text-white">{titulo}</span>
        <span className="block text-xs text-gray-500 dark:text-[#a8b3ae]">{descripcion}</span>
      </span>
      <span className="text-gray-400 group-hover:text-[#218739] dark:group-hover:text-[#2fa350] group-hover:translate-x-0.5 transition-all" aria-hidden="true">→</span>
    </Link>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
      <dt className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae]">{etiqueta}</dt>
      <dd className="text-sm font-semibold text-gray-900 dark:text-white sm:text-right break-words">{children}</dd>
    </div>
  )
}

// ---------------------------------------------------------
// Página
// ---------------------------------------------------------

function Perfil() {
  const navigate = useNavigate()
  const reducido = useReducedMotion()

  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  // Actividad (null mientras carga; cada lista puede fallar sola)
  const [actividad, setActividad] = useState(null)

  // Avisos flotantes
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // Datos de la cuenta
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  // Contraseña
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  useEffect(() => {
    if (!mensaje) return
    const id = setTimeout(() => setMensaje(''), 4500)
    return () => clearTimeout(id)
  }, [mensaje])

  const avisar = (texto) => {
    setError('')
    setMensaje(texto)
  }

  const fallar = (texto) => {
    setMensaje('')
    setError(texto)
  }

  // =========================================================
  // CARGAR USUARIO Y ACTIVIDAD
  // =========================================================

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setErrorCarga('Inicia sesión para ver tu perfil.')
      setCargando(false)
      return
    }

    const headers = { Authorization: `Bearer ${token}` }

    const cargarLista = async (ruta) => {
      const respuesta = await fetch(`${API_URL}${ruta}`, { headers })
      if (!respuesta.ok) throw new Error(ruta)
      const datos = await respuesta.json()
      return Array.isArray(datos) ? datos : []
    }

    const cargar = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/usuarios/me`, { headers })
        const datos = await respuesta.json().catch(() => null)

        if (!respuesta.ok) {
          if (respuesta.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('usuario')
            throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')
          }
          throw new Error(formatearMensajeError(datos?.detail, 'No pudimos cargar tu perfil.'))
        }

        setUsuario(datos)
        setNombre(datos.nombre || '')
        setCorreo(datos.correo || '')
        localStorage.setItem('usuario', JSON.stringify(datos))
      } catch (err) {
        console.error(err)
        setErrorCarga(err.message === 'Failed to fetch' ? 'No pudimos conectar con el servidor.' : err.message)
        return
      } finally {
        setCargando(false)
      }

      const [puntos, entregas, reportes] = await Promise.allSettled([
        cargarLista('/puntos/mis-puntos'),
        cargarLista('/entregas/mis-entregas'),
        cargarLista('/reportes/mis-reportes')
      ])

      const valor = (r) => (r.status === 'fulfilled' ? r.value : null)
      setActividad({ puntos: valor(puntos), entregas: valor(entregas), reportes: valor(reportes) })
    }

    cargar()
  }, [])

  // =========================================================
  // GUARDAR DATOS DE LA CUENTA
  // =========================================================

  const guardarPerfil = async (e) => {
    e.preventDefault()

    const nombreLimpio = nombre.trim()
    const correoLimpio = correo.trim()

    if (!nombreLimpio || !correoLimpio) {
      fallar('El nombre y el correo son obligatorios.')
      return
    }
    // Solo si lo cambió: hay cuentas antiguas con correos sin formato válido
    if (correoLimpio !== usuario?.correo && !CORREO_VALIDO.test(correoLimpio)) {
      fallar('Escribe un correo electrónico válido.')
      return
    }

    try {
      setGuardandoPerfil(true)

      const respuesta = await fetch(`${API_URL}/usuarios/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ nombre: nombreLimpio, correo: correoLimpio })
      })
      const datos = await respuesta.json().catch(() => null)

      if (!respuesta.ok) {
        throw new Error(formatearMensajeError(datos?.detail, 'No se pudieron guardar tus datos.'))
      }

      const actualizado = { ...usuario, ...datos }
      setUsuario(actualizado)
      setNombre(actualizado.nombre)
      setCorreo(actualizado.correo)
      localStorage.setItem('usuario', JSON.stringify(actualizado))

      setEditando(false)
      avisar('Guardamos tus datos.')
    } catch (err) {
      console.error(err)
      fallar(err.message === 'Failed to fetch' ? 'No pudimos conectar con el servidor.' : err.message)
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const cancelarEdicion = () => {
    setNombre(usuario?.nombre || '')
    setCorreo(usuario?.correo || '')
    setEditando(false)
  }

  // =========================================================
  // CAMBIAR CONTRASEÑA
  // =========================================================

  const cambiarPassword = async (e) => {
    e.preventDefault()

    if (!passwordActual || !nuevaPassword || !confirmarPassword) {
      fallar('Completa los tres campos para cambiar la contraseña.')
      return
    }
    if (nuevaPassword.length < MINIMO_CONTRASENA) {
      fallar(`La nueva contraseña debe tener al menos ${MINIMO_CONTRASENA} caracteres.`)
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      fallar('Las contraseñas nuevas no coinciden.')
      return
    }

    try {
      setGuardandoPassword(true)

      const respuesta = await fetch(`${API_URL}/usuarios/me/contrasena`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ password_actual: passwordActual, nueva_password: nuevaPassword })
      })
      const datos = await respuesta.json().catch(() => null)

      if (!respuesta.ok) {
        throw new Error(formatearMensajeError(datos?.detail, 'No se pudo cambiar la contraseña.'))
      }

      setPasswordActual('')
      setNuevaPassword('')
      setConfirmarPassword('')
      avisar('Cambiaste tu contraseña.')
    } catch (err) {
      console.error(err)
      fallar(err.message === 'Failed to fetch' ? 'No pudimos conectar con el servidor.' : err.message)
    } finally {
      setGuardandoPassword(false)
    }
  }

  // =========================================================
  // ESTADOS DE CARGA Y ERROR
  // =========================================================

  const fondo = 'min-h-[calc(100vh-4rem)] bg-[#f1f8f4] dark:bg-[#0f1512] text-gray-800 dark:text-[#f2f5f3]'

  if (cargando) {
    return (
      <div className={fondo}>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6" aria-busy="true">
          <div className="h-44 rounded-3xl bg-gray-200/70 dark:bg-gray-800/50 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-gray-200/70 dark:bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className={`${fondo} flex items-center justify-center p-4`}>
        <EstadoVacio icono="🔒" titulo="No pudimos abrir tu perfil" descripcion={errorCarga}>
          <BotonAccion variante="primario" onClick={() => navigate('/login')}>
            Iniciar sesión
          </BotonAccion>
        </EstadoVacio>
      </div>
    )
  }

  // =========================================================
  // DATOS CALCULADOS
  // =========================================================

  const inicial = usuario?.nombre?.trim()?.charAt(0)?.toUpperCase() || '?'
  const metodoAcceso = usuario?.con_google
    ? usuario?.tiene_password
      ? 'Google y contraseña'
      : 'Google'
    : 'Correo y contraseña'

  const { puntos, entregas, reportes } = actividad || {}
  const cargandoActividad = actividad === null
  const verificadas = entregas?.filter((e) => e.estado === 'verificada') ?? []
  const kg = verificadas.reduce((s, e) => s + kgDeEntrega(e), 0)

  const mostrar = (lista, texto) => (lista ? texto : 'No disponible')

  const passwordCorta = nuevaPassword.length > 0 && nuevaPassword.length < MINIMO_CONTRASENA
  const noCoinciden = confirmarPassword.length > 0 && confirmarPassword !== nuevaPassword

  const aparecer = (retraso = 0) => ({
    initial: reducido ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: reducido ? 0 : retraso }
  })

  // =========================================================
  // PERFIL
  // =========================================================

  return (
    <div className={fondo}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* ENCABEZADO */}
        <motion.section
          {...aparecer()}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#176b2b] via-[#218739] to-[#2fa350] p-6 sm:p-8 text-white"
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute right-12 -bottom-24 w-56 h-56 rounded-full bg-[#7ee08f]/20 blur-2xl" aria-hidden="true" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <span className="relative w-20 h-20 shrink-0 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md flex items-center justify-center text-3xl font-black" aria-hidden="true">
              {inicial}
              {usuario?.es_admin && (
                <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-400 border-2 border-[#218739] flex items-center justify-center text-xs">👑</span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c9f5d1]">Tu cuenta</p>
              <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight break-words">{usuario?.nombre}</h1>
              <p className="mt-1 text-sm text-white/85 break-all">{usuario?.correo}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {usuario?.es_admin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-extrabold">
                    👑 Administrador
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-bold">
                    🌱 Miembro de la comunidad
                  </span>
                )}
                {usuario?.con_google && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-gray-800 text-xs font-bold">
                    <LogoGoogle /> Entras con Google
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* TU ACTIVIDAD */}
        <motion.section {...aparecer(0.05)} aria-labelledby="titulo-actividad">
          <h2 id="titulo-actividad" className="sr-only">Tu actividad</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Indicador
              to="/mis-puntos"
              icono="📍"
              etiqueta="Puntos propuestos"
              valor={puntos ? puntos.length : '—'}
              detalle={mostrar(puntos, `${puntos?.filter((p) => p.estado === 'aprobado').length ?? 0} publicados`)}
              cargando={cargandoActividad}
            />
            <Indicador
              to="/historial"
              icono="♻️"
              etiqueta="Entregas"
              valor={entregas ? entregas.length : '—'}
              detalle={mostrar(entregas, `${verificadas.length} verificadas`)}
              cargando={cargandoActividad}
            />
            <Indicador
              to="/historial"
              icono="⚖️"
              etiqueta="Kg reciclados"
              valor={entregas ? formatearNumero(kg, 1) : '—'}
              detalle={mostrar(entregas, 'En entregas verificadas')}
              cargando={cargandoActividad}
            />
            <Indicador
              to="/mis-reportes"
              icono="🚩"
              etiqueta="Reportes"
              valor={reportes ? reportes.length : '—'}
              detalle={mostrar(reportes, `${reportes?.filter((r) => r.estado !== 'pendiente').length ?? 0} respondidos`)}
              cargando={cargandoActividad}
            />
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          {/* DATOS DE LA CUENTA */}
          <motion.section {...aparecer(0.1)} className={`${claseTarjeta} p-6`} aria-labelledby="titulo-datos">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="titulo-datos" className="text-base font-black text-gray-900 dark:text-white">Datos de la cuenta</h2>
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-1">
                  {editando ? 'Los cambios se verán en toda la plataforma.' : 'Así te ven los demás en eco-TRACE.'}
                </p>
              </div>
              {!editando && (
                <BotonAccion variante="secundario" onClick={() => setEditando(true)}>
                  ✏️ Editar
                </BotonAccion>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {editando ? (
                <motion.form
                  key="formulario"
                  initial={reducido ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={guardarPerfil}
                  noValidate
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label htmlFor="perfil-nombre" className={claseEtiqueta}>Nombre completo</label>
                    <input
                      id="perfil-nombre"
                      type="text"
                      autoComplete="name"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      maxLength={120}
                      autoFocus
                      className={claseCampo}
                    />
                  </div>
                  <div>
                    <label htmlFor="perfil-correo" className={claseEtiqueta}>Correo electrónico</label>
                    <input
                      id="perfil-correo"
                      type="email"
                      autoComplete="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      className={claseCampo}
                    />
                    {usuario?.con_google && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-[#a8b3ae]">
                        Tu cuenta de Google sigue vinculada aunque cambies este correo.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                    <BotonAccion onClick={cancelarEdicion} deshabilitado={guardandoPerfil}>Cancelar</BotonAccion>
                    <BotonAccion tipo="submit" variante="primario" cargando={guardandoPerfil}>
                      Guardar cambios
                    </BotonAccion>
                  </div>
                </motion.form>
              ) : (
                <motion.dl
                  key="datos"
                  initial={reducido ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mt-3 divide-y divide-gray-100 dark:divide-gray-800/60"
                >
                  <Dato etiqueta="Nombre">{usuario?.nombre}</Dato>
                  <Dato etiqueta="Correo electrónico">{usuario?.correo}</Dato>
                  <Dato etiqueta="Tipo de cuenta">{usuario?.es_admin ? 'Administrador' : 'Usuario'}</Dato>
                  <Dato etiqueta="Inicias sesión con">
                    <span className="inline-flex items-center gap-1.5">
                      {usuario?.con_google && <LogoGoogle />}
                      {metodoAcceso}
                    </span>
                  </Dato>
                </motion.dl>
              )}
            </AnimatePresence>
          </motion.section>

          {/* CONTRASEÑA */}
          <motion.section {...aparecer(0.15)} className={`${claseTarjeta} p-6`} aria-labelledby="titulo-seguridad">
            <h2 id="titulo-seguridad" className="text-base font-black text-gray-900 dark:text-white">Contraseña</h2>

            {usuario?.tiene_password === false ? (
              <div className="mt-4 rounded-2xl bg-[#f1f8f4] dark:bg-[#0f1512] border border-[#218739]/15 dark:border-gray-800 p-4">
                <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
                  <LogoGoogle className="w-4 h-4" /> Entras con tu cuenta de Google
                </p>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-[#a8b3ae] leading-relaxed">
                  No tienes una contraseña de eco-TRACE. Si quieres entrar también con tu correo, crea una:
                  te enviaremos un código a <strong className="text-gray-800 dark:text-[#dce4e0]">{usuario?.correo}</strong>.
                </p>
                <Link
                  to="/recuperar-password"
                  className={`mt-4 inline-flex items-center justify-center gap-1.5 min-h-10 px-4 rounded-xl text-xs font-bold text-white bg-[#176b2b] hover:bg-[#218739] dark:bg-[#218739] dark:hover:bg-[#2fa350] transition-colors ${anilloFoco}`}
                >
                  Crear una contraseña
                </Link>
              </div>
            ) : (
              <form onSubmit={cambiarPassword} noValidate className="mt-4 space-y-4">
                <p className="text-xs text-gray-500 dark:text-[#a8b3ae] -mt-2">
                  Por seguridad, primero escribe la contraseña que usas hoy.
                </p>
                <div>
                  <label htmlFor="password-actual" className={claseEtiqueta}>Contraseña actual</label>
                  <CampoContrasena
                    id="password-actual"
                    autoComplete="current-password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="Tu contraseña actual"
                  />
                </div>
                <div>
                  <label htmlFor="nueva-password" className={claseEtiqueta}>Nueva contraseña</label>
                  <CampoContrasena
                    id="nueva-password"
                    autoComplete="new-password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder={`Mínimo ${MINIMO_CONTRASENA} caracteres`}
                  />
                  <p className={`mt-1.5 text-xs ${passwordCorta ? 'text-red-700 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-[#a8b3ae]'}`}>
                    {passwordCorta
                      ? `Te faltan ${MINIMO_CONTRASENA - nuevaPassword.length} caracteres.`
                      : `Usa al menos ${MINIMO_CONTRASENA} caracteres.`}
                  </p>
                </div>
                <div>
                  <label htmlFor="confirmar-password" className={claseEtiqueta}>Repite la nueva contraseña</label>
                  <CampoContrasena
                    id="confirmar-password"
                    autoComplete="new-password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Escríbela otra vez"
                  />
                  {noCoinciden && (
                    <p className="mt-1.5 text-xs font-bold text-red-700 dark:text-red-400">Las contraseñas no coinciden.</p>
                  )}
                </div>
                <div className="flex justify-end pt-1">
                  <BotonAccion tipo="submit" variante="primario" cargando={guardandoPassword} textoCargando="Cambiando...">
                    Cambiar contraseña
                  </BotonAccion>
                </div>
              </form>
            )}
          </motion.section>
        </div>

        {/* ACCESOS DIRECTOS */}
        <motion.section {...aparecer(0.2)} aria-labelledby="titulo-accesos">
          <h2 id="titulo-accesos" className="text-base font-black text-gray-900 dark:text-white mb-3">Accesos directos</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Acceso to="/mis-puntos" icono="📍" titulo="Mis puntos" descripcion="Los puntos que propusiste y su estado" />
            <Acceso to="/historial" icono="♻️" titulo="Mis entregas" descripcion="Tu historial de entregas y donaciones" />
            <Acceso to="/mis-reportes" icono="🚩" titulo="Mis reportes" descripcion="Lo que reportaste y la respuesta del administrador" />
            <Acceso to="/mapa" icono="🗺️" titulo="Explorar el mapa" descripcion="Encuentra dónde reciclar o donar cerca de ti" />
            {usuario?.es_admin && (
              <Acceso to="/admin" icono="👑" titulo="Panel de administración" descripcion="Modera puntos, entregas, reportes y usuarios" destacado />
            )}
          </div>
        </motion.section>
      </main>

      <Avisos mensaje={mensaje} error={error} onCerrarMensaje={() => setMensaje('')} onCerrarError={() => setError('')} />
    </div>
  )
}

export default Perfil
