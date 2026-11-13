// =========================================================
// REGALOS: PUBLICAR (HU-24)
// =========================================================
// - Hasta 3 fotos, comprimidas en el navegador (también se les quitan
//   los metadatos EXIF, que pueden traer la ubicación GPS).
// - Zona en el mapa, dentro de Ciudad Bolívar (Turf con el GeoJSON).
//   Los demás solo verán un círculo aproximado de unos 300 m.
// - Hay que confirmar que no es un objeto prohibido.
// La publicación sale de inmediato; la comunidad puede reportarla.

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { Avisos, BotonAccion, claseCampo, claseTarjeta, EstadoVacio, anilloFoco } from '../components/admin/ui'
import { SelectorZona } from '../components/regalos/mapa'
import { claseBotonPrincipal, claseFondo, EncabezadoPagina } from '../components/regalos/piezas'
import { comprimirFoto, FOTO_MAX_BYTES, TIPOS_FOTO } from '../utils/archivos'
import { estaEnCiudadBolivar, obtenerPosicionActual } from '../utils/geo'
import {
  api,
  CATEGORIAS_REGALO,
  LIMITES_REGALO,
  leerSesion,
  OBJETOS_PROHIBIDOS,
  UNIDADES_REGALO
} from '../utils/regalos'

const claseEtiqueta = 'block text-xs font-bold text-gray-700 dark:text-[#dce4e0] mb-1.5'

function Seccion({ numero, titulo, descripcion, children }) {
  return (
    <section className={`${claseTarjeta} p-5 sm:p-6`} aria-labelledby={`seccion-${numero}`}>
      <div className="flex items-start gap-3 mb-5">
        <span className="w-8 h-8 shrink-0 rounded-full bg-[#176b2b] dark:bg-[#2fa350] text-white text-sm font-black flex items-center justify-center" aria-hidden="true">
          {numero}
        </span>
        <div>
          <h2 id={`seccion-${numero}`} className="text-base font-black text-gray-900 dark:text-white">{titulo}</h2>
          {descripcion && <p className="text-xs text-gray-500 dark:text-[#a8b3ae] mt-0.5">{descripcion}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Contador({ valor, maximo }) {
  return <span className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae] tabular-nums" aria-hidden="true">{valor}/{maximo}</span>
}

function ErrorCampo({ id, texto }) {
  if (!texto) return null
  return <p id={id} className="mt-1.5 text-xs font-bold text-red-700 dark:text-red-400">{texto}</p>
}

function RegaloNuevo() {
  const navigate = useNavigate()
  const reducido = useReducedMotion()
  const sesion = leerSesion()
  const refArchivo = useRef(null)

  // Fotos: [{ archivo, url }]
  const [fotos, setFotos] = useState([])
  const [procesandoFotos, setProcesandoFotos] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('kg')
  const [descripcion, setDescripcion] = useState('')
  const [ubicacion, setUbicacion] = useState(null)
  const [barrio, setBarrio] = useState('')
  const [aceptaReglas, setAceptaReglas] = useState(false)

  const [errores, setErrores] = useState({})
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  // Liberar las vistas previas al salir
  const refFotos = useRef(fotos)
  useEffect(() => {
    refFotos.current = fotos
  }, [fotos])
  useEffect(() => () => refFotos.current.forEach((f) => URL.revokeObjectURL(f.url)), [])

  const limpiarError = (campo) => setErrores((e) => ({ ...e, [campo]: undefined }))

  if (!sesion) {
    return (
      <div className={`${claseFondo} flex items-center justify-center p-4`}>
        <EstadoVacio icono="🔒" titulo="Inicia sesión para regalar algo" descripcion="Necesitas una cuenta para publicar y para que los interesados te escriban.">
          <Link to="/login" className={claseBotonPrincipal}>Iniciar sesión</Link>
        </EstadoVacio>
      </div>
    )
  }

  // ---------------------------------------------------------
  // Fotos
  // ---------------------------------------------------------

  const agregarFotos = async (lista) => {
    const archivos = [...lista]
    if (!archivos.length) return

    const libres = LIMITES_REGALO.fotos - fotos.length
    if (archivos.length > libres) {
      setError(`Puedes subir máximo ${LIMITES_REGALO.fotos} fotos.`)
    }

    const invalida = archivos.find((a) => !TIPOS_FOTO.includes(a.type))
    if (invalida) {
      setError(`"${invalida.name}" no es una imagen JPG, PNG o WEBP.`)
      return
    }

    setProcesandoFotos(true)
    try {
      const nuevas = []
      for (const archivo of archivos.slice(0, libres)) {
        const comprimida = await comprimirFoto(archivo)
        if (comprimida.size > FOTO_MAX_BYTES) {
          setError(`"${archivo.name}" pesa demasiado (máximo 5 MB).`)
          continue
        }
        nuevas.push({ archivo: comprimida, url: URL.createObjectURL(comprimida) })
      }
      setFotos((actuales) => [...actuales, ...nuevas].slice(0, LIMITES_REGALO.fotos))
      if (nuevas.length) limpiarError('fotos')
    } finally {
      setProcesandoFotos(false)
    }
  }

  const quitarFoto = (indice) => {
    setFotos((actuales) => {
      URL.revokeObjectURL(actuales[indice].url)
      return actuales.filter((_, i) => i !== indice)
    })
  }

  // ---------------------------------------------------------
  // Ubicación
  // ---------------------------------------------------------

  const elegirZona = (coords, limite) => {
    if (limite && !estaEnCiudadBolivar(coords, limite)) {
      setErrores((e) => ({ ...e, ubicacion: 'Ese punto está fuera de Ciudad Bolívar. Elige una zona dentro del límite verde.' }))
      return
    }
    setUbicacion(coords)
    limpiarError('ubicacion')
  }

  const usarMiUbicacion = async () => {
    setBuscandoUbicacion(true)
    try {
      const { coords } = await obtenerPosicionActual()
      const limite = await fetch('/data/ciudadBolivar.geojson').then((r) => r.json())
      if (!estaEnCiudadBolivar(coords, limite)) {
        setErrores((e) => ({ ...e, ubicacion: 'Tu ubicación actual está fuera de Ciudad Bolívar. Marca la zona del regalo en el mapa.' }))
        return
      }
      setUbicacion(coords)
      limpiarError('ubicacion')
    } catch (err) {
      setErrores((e) => ({ ...e, ubicacion: err.message }))
    } finally {
      setBuscandoUbicacion(false)
    }
  }

  // ---------------------------------------------------------
  // Publicar
  // ---------------------------------------------------------

  const validar = () => {
    const nuevos = {}
    const numero = Number(cantidad.replace(',', '.'))

    if (!fotos.length) nuevos.fotos = 'Agrega al menos una foto del regalo.'
    if (titulo.trim().length < 3) nuevos.titulo = 'Escribe un título de al menos 3 caracteres.'
    if (!categoria) nuevos.categoria = 'Elige una categoría.'
    if (!(numero > 0)) nuevos.cantidad = 'Indica una cantidad mayor que 0.'
    if (!ubicacion) nuevos.ubicacion = 'Marca en el mapa la zona donde está el regalo.'
    if (!aceptaReglas) nuevos.reglas = 'Confirma que no es un objeto prohibido.'

    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const publicar = async (e) => {
    e.preventDefault()
    setError('')

    if (!validar()) {
      setError('Revisa los campos marcados antes de publicar.')
      return
    }

    const datos = new FormData()
    datos.append('titulo', titulo.trim())
    datos.append('categoria', categoria)
    datos.append('cantidad', String(Number(cantidad.replace(',', '.'))))
    datos.append('unidad', unidad)
    datos.append('latitud', String(ubicacion[0]))
    datos.append('longitud', String(ubicacion[1]))
    if (descripcion.trim()) datos.append('descripcion', descripcion.trim())
    if (barrio.trim()) datos.append('barrio', barrio.trim())
    datos.append('acepta_reglas', 'true')
    fotos.forEach((f) => datos.append('fotos', f.archivo))

    setEnviando(true)
    try {
      const regalo = await api('/regalos', { metodo: 'POST', cuerpo: datos })
      navigate(`/regalos/${regalo.id}`, { replace: true, state: { aviso: '¡Publicaste tu regalo! Ya lo pueden ver tus vecinos.' } })
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  const esOtro = categoria === 'otro'

  return (
    <div className={claseFondo}>
      <motion.main
        initial={reducido ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6"
      >
        <Link to="/regalos" className={`inline-flex text-sm font-bold text-gray-600 dark:text-[#a8b3ae] hover:text-[#218739] dark:hover:text-[#2fa350] rounded-lg ${anilloFoco}`}>
          ← Volver a Regalos
        </Link>

        <EncabezadoPagina
          etiqueta="Regalar algo"
          titulo="Publica tu regalo"
          descripcion="Sale de inmediato y es gratis. Los interesados te escribirán por el chat y tú eliges a quién se lo entregas."
        />

        <form onSubmit={publicar} className="space-y-6" noValidate>
          {/* 1. FOTOS */}
          <Seccion numero={1} titulo="Fotos" descripcion={`Hasta ${LIMITES_REGALO.fotos}. La primera será la portada.`}>
            <div className="grid grid-cols-3 gap-3">
              {fotos.map((foto, i) => (
                <div key={foto.url} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                  <img src={foto.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">Portada</span>
                  )}
                  <button
                    type="button"
                    onClick={() => quitarFoto(i)}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white text-sm flex items-center justify-center cursor-pointer ${anilloFoco}`}
                    aria-label={`Quitar la foto ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {fotos.length < LIMITES_REGALO.fotos && (
                <button
                  type="button"
                  onClick={() => refArchivo.current?.click()}
                  disabled={procesandoFotos}
                  aria-describedby={errores.fotos ? 'error-fotos' : undefined}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-center px-2 cursor-pointer transition-colors disabled:opacity-60 ${anilloFoco} ${
                    errores.fotos
                      ? 'border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-[#218739] dark:hover:border-[#2fa350] bg-gray-50/60 dark:bg-[#0f1512]'
                  }`}
                >
                  {procesandoFotos ? (
                    <span className="w-6 h-6 border-2 border-[#218739]/30 border-t-[#218739] rounded-full animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">📷</span>
                  )}
                  <span className="text-xs font-bold text-gray-700 dark:text-[#dce4e0]">
                    {procesandoFotos ? 'Preparando…' : 'Agregar foto'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={refArchivo}
              type="file"
              accept={TIPOS_FOTO.join(',')}
              multiple
              className="hidden"
              onChange={(e) => {
                agregarFotos(e.target.files)
                e.target.value = ''
              }}
            />
            <ErrorCampo id="error-fotos" texto={errores.fotos} />
          </Seccion>

          {/* 2. QUÉ REGALAS */}
          <Seccion numero={2} titulo="¿Qué regalas?" descripcion="Un título claro ayuda a que lo encuentren.">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end">
                  <label htmlFor="titulo" className={claseEtiqueta}>Título</label>
                  <Contador valor={titulo.length} maximo={LIMITES_REGALO.titulo} />
                </div>
                <input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value)
                    limpiarError('titulo')
                  }}
                  maxLength={LIMITES_REGALO.titulo}
                  placeholder="Ej.: Tablas de madera de una obra"
                  aria-invalid={Boolean(errores.titulo)}
                  aria-describedby={errores.titulo ? 'error-titulo' : undefined}
                  className={claseCampo}
                />
                <ErrorCampo id="error-titulo" texto={errores.titulo} />
              </div>

              <fieldset>
                <legend className={claseEtiqueta}>Categoría</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-describedby={errores.categoria ? 'error-categoria' : undefined}>
                  {CATEGORIAS_REGALO.map((c) => {
                    const activa = categoria === c.id
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 min-h-11 px-3 rounded-xl border text-sm font-bold cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#218739] ${
                          activa
                            ? 'bg-[#176b2b] dark:bg-[#2fa350] text-white border-transparent'
                            : 'bg-white dark:bg-[#0f1512] text-gray-700 dark:text-[#dce4e0] border-gray-200 dark:border-gray-800 hover:border-[#218739]/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="categoria"
                          value={c.id}
                          checked={activa}
                          onChange={() => {
                            setCategoria(c.id)
                            limpiarError('categoria')
                          }}
                          className="sr-only"
                        />
                        <span aria-hidden="true">{c.icono}</span>
                        {c.nombre}
                      </label>
                    )
                  })}
                </div>
                <ErrorCampo id="error-categoria" texto={errores.categoria} />
              </fieldset>

              <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                <div>
                  <label htmlFor="cantidad" className={claseEtiqueta}>Cantidad</label>
                  <input
                    id="cantidad"
                    inputMode="decimal"
                    value={cantidad}
                    onChange={(e) => {
                      setCantidad(e.target.value.replace(/[^\d.,]/g, ''))
                      limpiarError('cantidad')
                    }}
                    placeholder={unidad === 'kg' ? 'Ej.: 5' : 'Ej.: 2'}
                    aria-invalid={Boolean(errores.cantidad)}
                    aria-describedby={errores.cantidad ? 'error-cantidad' : undefined}
                    className={claseCampo}
                  />
                  <ErrorCampo id="error-cantidad" texto={errores.cantidad} />
                </div>
                <fieldset>
                  <legend className={claseEtiqueta}>Unidad</legend>
                  <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {UNIDADES_REGALO.map((u) => (
                      <label
                        key={u.id}
                        className={`px-4 min-h-[2.65rem] flex items-center text-sm font-bold cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#218739] ${
                          unidad === u.id ? 'bg-[#176b2b] dark:bg-[#2fa350] text-white' : 'bg-white dark:bg-[#0f1512] text-gray-700 dark:text-[#dce4e0]'
                        }`}
                      >
                        <input type="radio" name="unidad" value={u.id} checked={unidad === u.id} onChange={() => setUnidad(u.id)} className="sr-only" />
                        {u.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <p className="-mt-3 text-xs text-gray-500 dark:text-[#a8b3ae]">
                Si lo pesas en kg, al entregarlo sumará a los "kg reutilizados" del impacto de la comunidad.
              </p>

              <div>
                <div className="flex justify-between items-end">
                  <label htmlFor="descripcion" className={claseEtiqueta}>
                    Descripción <span className="font-medium text-gray-500">(opcional)</span>
                  </label>
                  <Contador valor={descripcion.length} maximo={LIMITES_REGALO.descripcion} />
                </div>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={LIMITES_REGALO.descripcion}
                  rows={3}
                  placeholder="Estado, medidas, cuándo lo pueden recoger…"
                  className={`${claseCampo} resize-none`}
                />
              </div>
            </div>
          </Seccion>

          {/* 3. DÓNDE */}
          <Seccion numero={3} titulo="¿Dónde está?" descripcion="Los demás solo verán un círculo de unos 300 m, nunca el punto exacto.">
            <div className="space-y-4">
              <SelectorZona valor={ubicacion} onElegir={elegirZona} />
              <div className="flex flex-wrap items-center gap-2">
                <BotonAccion onClick={usarMiUbicacion} cargando={buscandoUbicacion} textoCargando="Buscando…">
                  📍 Usar mi ubicación
                </BotonAccion>
                {ubicacion && <span className="text-xs font-bold text-[#176b2b] dark:text-[#2fa350]">✓ Zona marcada</span>}
              </div>
              <ErrorCampo id="error-ubicacion" texto={errores.ubicacion} />

              <div>
                <label htmlFor="barrio" className={claseEtiqueta}>
                  Barrio <span className="font-medium text-gray-500">(opcional, recomendado)</span>
                </label>
                <input
                  id="barrio"
                  value={barrio}
                  onChange={(e) => setBarrio(e.target.value)}
                  maxLength={LIMITES_REGALO.barrio}
                  placeholder="Ej.: Lucero, Arborizadora Alta, Perdomo"
                  className={claseCampo}
                />
              </div>
            </div>
          </Seccion>

          {/* 4. REGLAS */}
          <Seccion numero={4} titulo="Antes de publicar" descripcion="Para que Regalos sea un espacio seguro.">
            <div
              className={`rounded-2xl border p-4 ${
                esOtro
                  ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  : 'bg-gray-50 dark:bg-[#0f1512] border-gray-100 dark:border-gray-800/60'
              }`}
            >
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">No se permite regalar:</p>
              <ul className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-[#dce4e0]">
                {OBJETOS_PROHIBIDOS.map((objeto) => (
                  <li key={objeto} className="flex gap-2"><span aria-hidden="true">🚫</span>{objeto}</li>
                ))}
              </ul>
              {esOtro && (
                <p className="mt-3 text-xs font-bold text-amber-800 dark:text-amber-300">
                  Elegiste "Otro": revisa con cuidado que tu regalo no esté en esta lista.
                </p>
              )}
            </div>

            <label className="mt-4 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aceptaReglas}
                onChange={(e) => {
                  setAceptaReglas(e.target.checked)
                  limpiarError('reglas')
                }}
                aria-invalid={Boolean(errores.reglas)}
                aria-describedby={errores.reglas ? 'error-reglas' : undefined}
                className="mt-0.5 w-5 h-5 accent-[#218739] cursor-pointer"
              />
              <span className="text-sm text-gray-800 dark:text-[#f2f5f3]">
                Confirmo que no es un objeto prohibido y que lo regalo <strong>sin cobrar nada</strong>.
              </span>
            </label>
            <ErrorCampo id="error-reglas" texto={errores.reglas} />
          </Seccion>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link to="/regalos" className={`inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-bold text-gray-700 dark:text-[#dce4e0] hover:bg-white dark:hover:bg-[#1a2320] ${anilloFoco}`}>
              Cancelar
            </Link>
            <button type="submit" disabled={enviando || procesandoFotos} className={`${claseBotonPrincipal} disabled:opacity-60 disabled:cursor-not-allowed`}>
              {enviando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Publicando…
                </>
              ) : (
                <>🎁 Publicar regalo</>
              )}
            </button>
          </div>
        </form>
      </motion.main>

      <Avisos error={error} onCerrarError={() => setError('')} />
    </div>
  )
}

export default RegaloNuevo
