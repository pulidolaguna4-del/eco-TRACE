// =========================================================
// INICIO
// =========================================================
// Presenta eco-TRACE a quien llega por primera vez: qué es, qué
// categorías recibe, cómo funciona, el impacto en vivo y preguntas
// frecuentes. Las cifras vienen de GET /impacto (si falla, se ocultan).
// Fotos: Mussi Katz, Wikimedia Commons, CC0.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'

import { API_URL } from '../../config'
import fotoTransMiCable from '../assets/ciudad-bolivar-transmicable.jpg'
import fotoLadera from '../assets/ciudad-bolivar-ladera.jpg'
import Logo from '../components/Logo'

// =========================================================
// CONTENIDO
// =========================================================

const CATEGORIAS = [
  {
    nombre: 'Reciclaje Tradicional',
    icono: '♻️',
    acento: 'bg-green-50 dark:bg-green-950/30 text-[#218739] dark:text-[#2fa350]',
    borde: 'hover:border-[#218739]/40',
    descripcion: 'Materiales aprovechables que vuelven a la cadena productiva en lugar de terminar en el relleno.',
    acepta: ['Botellas PET', 'Papel y cartón', 'Vidrio', 'Latas y metales', 'Tetrapak'],
    consejo: 'Entrégalos limpios, secos y separados por tipo.'
  },
  {
    nombre: 'Donación de Ropa',
    icono: '👕',
    acento: 'bg-blue-50 dark:bg-blue-950/30 text-[#1976d2] dark:text-blue-400',
    borde: 'hover:border-[#1976d2]/40',
    descripcion: 'Prendas que todavía pueden servirle a otra familia de la localidad.',
    acepta: ['Ropa limpia en buen estado', 'Zapatos en pares', 'Cobijas y sábanas', 'Ropa de bebé'],
    consejo: 'Lávala antes y llévala doblada en una bolsa.'
  },
  {
    nombre: 'Residuos Electrónicos',
    icono: '💻',
    acento: 'bg-purple-50 dark:bg-purple-950/30 text-[#7b1fa2] dark:text-purple-400',
    borde: 'hover:border-[#7b1fa2]/40',
    descripcion: 'Aparatos que no deben ir a la basura porque sus componentes contaminan.',
    acepta: ['Celulares y tabletas', 'Cargadores y cables', 'Computadores y periféricos', 'Pequeños electrodomésticos'],
    consejo: 'Borra tus datos personales antes de entregar un celular o computador.'
  }
]

const PASOS = [
  {
    icono: '🔎',
    titulo: 'Encuentra un punto',
    texto: 'Filtra el mapa por categoría, revisa las reseñas y pide la ruta desde tu ubicación.'
  },
  {
    icono: '♻️',
    titulo: 'Entrega y regístrala',
    texto: 'Lleva tus materiales y registra qué entregaste, cuánto y en qué punto.'
  },
  {
    icono: '🛡️',
    titulo: 'Se verifica',
    texto: 'Un administrador revisa las entregas y los puntos nuevos para que la información sea confiable.'
  },
  {
    icono: '📊',
    titulo: 'Suma al impacto',
    texto: 'Tus kilos se suman al total de Ciudad Bolívar en el dashboard de impacto.'
  }
]

const PREGUNTAS = [
  {
    pregunta: '¿eco-TRACE tiene algún costo?',
    respuesta: 'No. Consultar el mapa, crear una cuenta, proponer puntos y registrar tus entregas es gratis.'
  },
  {
    pregunta: '¿Necesito una cuenta para usar el mapa?',
    respuesta: 'Para ver el mapa, filtrar puntos y pedir la ruta, no. Para proponer puntos, registrar entregas, calificar o reportar, sí.'
  },
  {
    pregunta: '¿Quién puede proponer un punto ecológico?',
    respuesta: 'Cualquier persona con cuenta. Marcas el punto con tu ubicación, una dirección o un clic en el mapa, y queda pendiente hasta que un administrador lo apruebe.'
  },
  {
    pregunta: '¿Cómo se verifica la información?',
    respuesta: 'Los administradores revisan cada punto antes de publicarlo y verifican las entregas. Además, la comunidad califica los puntos y reporta los datos incorrectos.'
  },
  {
    pregunta: '¿Qué pasa si un punto ya no funciona?',
    respuesta: 'Repórtalo o déjale una reseña. Si un punto recibe varias reseñas negativas en poco tiempo, se marca para que un administrador lo revise con prioridad.'
  },
  {
    pregunta: '¿Para qué registro mis entregas?',
    respuesta: 'Para llevar tu propio historial y para que tu aporte se sume a los kilos reciclados y donados de toda la localidad.'
  },
  {
    pregunta: '¿Solo funciona en Ciudad Bolívar?',
    respuesta: 'Por ahora sí: Ciudad Bolívar es la cobertura inicial del proyecto.'
  }
]

// =========================================================
// UTILIDADES DE ANIMACIÓN
// =========================================================

const ELEMENTOS = { div: motion.div, li: motion.li }

// Aparece al entrar en pantalla (una sola vez). `como` elige la etiqueta
// para no romper listas (<li> dentro de <ol>, por ejemplo).
function Aparecer({ children, retraso = 0, className = '', desde = 24, como = 'div' }) {
  const prefiereReducido = useReducedMotion()
  const Elemento = ELEMENTOS[como]

  return (
    <Elemento
      initial={prefiereReducido ? false : { opacity: 0, y: desde }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: retraso, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Elemento>
  )
}

// Cuenta de 0 al valor cuando el número entra en pantalla
function Contador({ valor, decimales = 0, sufijo = '' }) {
  const ref = useRef(null)
  const visible = useInView(ref, { once: true, amount: 0.6 })
  const prefiereReducido = useReducedMotion()
  const [mostrado, setMostrado] = useState(0)

  useEffect(() => {
    if (!visible) return
    if (prefiereReducido) {
      setMostrado(valor)
      return
    }

    let id
    const inicio = performance.now()
    const duracion = 1400

    const avanzar = (ahora) => {
      const t = Math.min((ahora - inicio) / duracion, 1)
      const suavizado = 1 - Math.pow(1 - t, 3)
      setMostrado(valor * suavizado)
      if (t < 1) id = requestAnimationFrame(avanzar)
    }

    id = requestAnimationFrame(avanzar)
    return () => cancelAnimationFrame(id)
  }, [visible, valor, prefiereReducido])

  return (
    <span ref={ref} className="tabular-nums">
      {mostrado.toLocaleString('es-CO', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
      })}
      {sufijo}
    </span>
  )
}

function irASeccion(evento, id) {
  evento.preventDefault()
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth' })
}

function Encabezado({ etiqueta, titulo, texto, centrado = true }) {
  return (
    <Aparecer className={`${centrado ? 'text-center mx-auto' : ''} max-w-2xl mb-12`}>
      <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">
        {etiqueta}
      </span>
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mt-2">
        {titulo}
      </h2>
      {texto && (
        <p className="text-sm sm:text-base text-gray-500 dark:text-[#a8b3ae] mt-3 leading-relaxed">
          {texto}
        </p>
      )}
    </Aparecer>
  )
}

// =========================================================
// SECCIONES
// =========================================================

function Hero({ impacto, sesionActiva }) {
  const prefiereReducido = useReducedMotion()

  const palabras = ['El', 'mapa', 'verde', 'de', 'Ciudad', 'Bolívar']

  const cifras = impacto
    ? [
        { valor: impacto.puntos_activos, etiqueta: 'Puntos activos', icono: '📍' },
        { valor: impacto.kg_reciclados, decimales: 1, sufijo: ' kg', etiqueta: 'Reciclados', icono: '♻️' },
        { valor: impacto.usuarios_participantes, etiqueta: 'Vecinos participando', icono: '🤝' }
      ]
    : []

  return (
    <section className="relative min-h-[92vh] flex items-end overflow-hidden text-white">
      {/* FOTO CON ZOOM LENTO + VELOS */}
      <motion.img
        src={fotoTransMiCable}
        alt="Cabinas del TransMiCable sobre las casas de colores de Ciudad Bolívar, Bogotá"
        initial={prefiereReducido ? false : { scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full object-cover object-[55%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#0b1f14]/35 to-[#0b1f14]/95" aria-hidden="true" />
      <div className="absolute inset-0 bg-[#176b2b]/20 mix-blend-multiply" aria-hidden="true" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-14">
        <motion.span
          initial={prefiereReducido ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-bold"
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#4caf68] opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-[#4caf68]" />
          </span>
          Ciudad Bolívar, Bogotá · Red comunitaria
        </motion.span>

        <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02] max-w-4xl">
          {palabras.map((palabra, n) => (
            <motion.span
              key={palabra + n}
              initial={prefiereReducido ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + n * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`inline-block mr-[0.22em] ${palabra === 'verde' ? 'text-[#7ee08f]' : ''}`}
            >
              {palabra}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={prefiereReducido ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="mt-6 text-base sm:text-xl text-white/85 max-w-2xl leading-relaxed"
        >
          Encuentra dónde reciclar, donar ropa o dejar tus residuos electrónicos.
          Puntos propuestos por tus vecinos y verificados antes de llegar al mapa.
        </motion.p>

        <motion.div
          initial={prefiereReducido ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Link
            to="/mapa"
            className="group px-6 py-3.5 rounded-2xl bg-white text-[#176b2b] text-sm font-extrabold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            🗺️ Explorar el mapa
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>

          {sesionActiva ? (
            <Link
              to="/historial"
              className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-sm font-bold transition-colors"
            >
              ♻️ Mis entregas
            </Link>
          ) : (
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-sm font-bold transition-colors"
            >
              Crear cuenta gratis
            </Link>
          )}

          <a
            href="#como-funciona"
            onClick={(e) => irASeccion(e, 'como-funciona')}
            className="px-3 py-3.5 text-sm font-bold text-white/80 hover:text-white underline underline-offset-4"
          >
            ¿Cómo funciona?
          </a>
        </motion.div>

        {/* CIFRAS EN VIVO */}
        {cifras.length > 0 && (
          <motion.dl
            initial={prefiereReducido ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl"
          >
            {cifras.map((cifra) => (
              <div
                key={cifra.etiqueta}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-4"
              >
                <dt className="text-xs font-bold text-white/70 flex items-center gap-1.5">
                  <span aria-hidden="true">{cifra.icono}</span> {cifra.etiqueta}
                </dt>
                <dd className="text-3xl font-black mt-1">
                  <Contador valor={cifra.valor} decimales={cifra.decimales ?? 0} sufijo={cifra.sufijo ?? ''} />
                </dd>
              </div>
            ))}
          </motion.dl>
        )}
      </div>

      {/* INDICADOR PARA BAJAR */}
      <a
        href="#que-es"
        onClick={(e) => irASeccion(e, 'que-es')}
        aria-label="Ir a ¿Qué es eco-TRACE?"
        className="absolute bottom-5 right-6 hidden md:flex w-10 h-16 rounded-full border-2 border-white/40 items-start justify-center pt-2"
      >
        <motion.span
          animate={prefiereReducido ? {} : { y: [0, 14, 0], opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="block w-1.5 h-3 rounded-full bg-white"
        />
      </a>
    </section>
  )
}



function QueEs() {
  const pilares = [
    {
      icono: '🔎',
      titulo: 'Encuentra',
      texto: 'Todos los puntos de reciclaje y donación de la localidad en un mapa, con ruta desde donde estés.'
    },
    {
      icono: '🤝',
      titulo: 'Participa',
      texto: 'Propón puntos nuevos, registra tus entregas y califica los lugares que visitas.'
    },
    {
      icono: '🛡️',
      titulo: 'Confía',
      texto: 'Nada se publica sin revisión, y la comunidad reporta lo que deja de funcionar.'
    }
  ]

  return (
    <section id="que-es" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <Aparecer>
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#218739] dark:text-[#2fa350]">
            ¿Qué es eco-TRACE?
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white mt-2">
            Todo lo que necesitas para reciclar, en un solo lugar
          </h2>
          <p className="text-base text-gray-600 dark:text-[#a8b3ae] mt-5 leading-relaxed">
            En Ciudad Bolívar hay lugares que reciben reciclaje, ropa y electrónicos,
            pero la información está dispersa y muchas veces desactualizada.
          </p>
          <p className="text-base text-gray-600 dark:text-[#a8b3ae] mt-4 leading-relaxed">
            eco-TRACE la reúne en un mapa que construye la propia comunidad: los vecinos
            proponen los puntos, un administrador los verifica y todos podemos ver el
            impacto de lo que reciclamos y donamos juntos.
          </p>
        </Aparecer>

        <div className="space-y-4">
          {pilares.map((pilar, n) => (
            <Aparecer key={pilar.titulo} retraso={n * 0.12} desde={30}>
              <div className="group flex gap-5 items-start rounded-3xl bg-white dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/40 p-6 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <span className="w-14 h-14 shrink-0 rounded-2xl bg-[#f1f8f4] dark:bg-[#121816] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {pilar.icono}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{pilar.titulo}</h3>
                  <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-1 leading-relaxed">{pilar.texto}</p>
                </div>
              </div>
            </Aparecer>
          ))}
        </div>
      </div>
    </section>
  )
}

function Categorias({ impacto }) {
  const porCategoria = new Map((impacto?.por_categoria ?? []).map((c) => [c.categoria, c]))

  return (
    <section id="categorias" className="scroll-mt-20 bg-white dark:bg-[#121816] py-24 border-y border-gray-100 dark:border-gray-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Encabezado
          etiqueta="Categorías"
          titulo="¿Qué puedes llevar a un punto?"
          texto="Cada punto ecológico recibe una o varias de estas categorías. En el mapa puedes filtrarlos por la que necesites."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIAS.map((categoria, n) => {
            const datos = porCategoria.get(categoria.nombre)

            return (
              <Aparecer key={categoria.nombre} retraso={n * 0.12} desde={40} className="h-full">
                <article className={`h-full flex flex-col rounded-3xl bg-[#f8fbf9] dark:bg-[#1a2320] border border-gray-100 dark:border-gray-800/40 ${categoria.borde} p-7 hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${categoria.acento}`}>
                      {categoria.icono}
                    </span>
                    {datos && (
                      <span className="text-right">
                        <span className="block text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                          {datos.puntos_activos}
                        </span>
                        <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          {datos.puntos_activos === 1 ? 'punto activo' : 'puntos activos'}
                        </span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-gray-900 dark:text-white mt-6">{categoria.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-2 leading-relaxed">{categoria.descripcion}</p>

                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mt-6 mb-2">
                    Puedes llevar
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {categoria.acepta.map((item) => (
                      <li
                        key={item}
                        className="px-3 py-1.5 rounded-full bg-white dark:bg-[#121816] border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-[#dce4e0]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-auto pt-6 text-xs text-gray-600 dark:text-[#a8b3ae] flex gap-2">
                    <span aria-hidden="true">💡</span>
                    <span><strong>Consejo:</strong> {categoria.consejo}</span>
                  </p>
                </article>
              </Aparecer>
            )
          })}
        </div>

        <Aparecer className="text-center mt-10">
          <Link
            to="/mapa"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#218739] hover:bg-[#176b2b] text-white text-sm font-bold transition-colors"
          >
            Ver los puntos en el mapa →
          </Link>
        </Aparecer>
      </div>
    </section>
  )
}

function ComoFunciona() {
  const prefiereReducido = useReducedMotion()

  return (
    <section id="como-funciona" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Encabezado
        etiqueta="Cómo funciona"
        titulo="De tu casa al mapa en cuatro pasos"
        texto="Así se mueve la información en eco-TRACE, desde que encuentras un punto hasta que tu aporte se ve en las cifras de la localidad."
      />

      <div className="relative">
        {/* LÍNEA QUE SE DIBUJA AL APARECER (escritorio) */}
        <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true">
          <motion.div
            initial={prefiereReducido ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-[#218739] to-[#4caf68] origin-left"
          />
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {PASOS.map((paso, n) => (
            <Aparecer key={paso.titulo} como="li" retraso={0.15 + n * 0.18} className="relative text-center list-none">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-white dark:bg-[#1a2320] border-2 border-[#218739]/30 dark:border-[#2fa350]/30 shadow-lg flex items-center justify-center text-2xl">
                {paso.icono}
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#218739] dark:bg-[#2fa350] text-white text-xs font-black flex items-center justify-center">
                  {n + 1}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-5">{paso.titulo}</h3>
              <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-2 leading-relaxed max-w-xs mx-auto">{paso.texto}</p>
            </Aparecer>
          ))}
        </ol>
      </div>

      {/* PROPONER UN PUNTO */}
      <Aparecer className="mt-16">
        <div className="rounded-3xl border border-dashed border-[#218739]/40 dark:border-[#2fa350]/40 bg-[#218739]/5 dark:bg-[#2fa350]/5 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex gap-4 items-start">
            <span className="text-3xl" aria-hidden="true">📍</span>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                ¿Conoces un punto que no está en el mapa?
              </h3>
              <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-1">
                Propónlo con tu ubicación actual, buscando la dirección o con un clic. Un administrador lo revisará.
              </p>
            </div>
          </div>
          <Link
            to="/mapa"
            className="shrink-0 px-5 py-3 rounded-2xl bg-white dark:bg-[#1a2320] border border-[#218739]/30 text-[#218739] dark:text-[#2fa350] text-sm font-bold text-center hover:bg-[#218739] hover:text-white dark:hover:bg-[#2fa350] dark:hover:text-white transition-colors"
          >
            ➕ Proponer un punto
          </Link>
        </div>
      </Aparecer>
    </section>
  )
}

function ImpactoEnVivo({ impacto }) {
  const cifras = [
    { valor: impacto.kg_reciclados, decimales: 1, sufijo: ' kg', etiqueta: 'Reciclados y donados' },
    { valor: impacto.total_entregas, etiqueta: 'Entregas registradas' },
    { valor: impacto.puntos_activos, etiqueta: 'Puntos activos' },
    { valor: impacto.usuarios_participantes, etiqueta: 'Vecinos participando' }
  ]

  return (
    <section className="relative overflow-hidden py-24 text-white">
      <img
        src={fotoLadera}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#0b1f14]/85" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f14] via-transparent to-[#0b1f14]/60" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Aparecer className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#7ee08f]">
            Impacto en vivo
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-2">
            Lo que llevamos entre todos
          </h2>
          <p className="text-white/75 mt-3 leading-relaxed">
            Cifras reales de la plataforma, que crecen con cada entrega registrada en Ciudad Bolívar.
          </p>
        </Aparecer>

        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cifras.map((cifra, n) => (
            <Aparecer
              key={cifra.etiqueta}
              retraso={n * 0.1}
              className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-6 h-full"
            >
              <p className="text-4xl sm:text-5xl font-black">
                <Contador valor={cifra.valor} decimales={cifra.decimales ?? 0} sufijo={cifra.sufijo ?? ''} />
              </p>
              <p className="text-sm font-semibold text-white/70 mt-2">{cifra.etiqueta}</p>
            </Aparecer>
          ))}
        </div>

        <Aparecer className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/impacto"
            className="px-6 py-3 rounded-2xl bg-white text-[#176b2b] text-sm font-extrabold hover:shadow-xl transition-shadow"
          >
            📊 Ver el dashboard de impacto
          </Link>
          {impacto.entregas_por_verificar > 0 && (
            <p className="text-xs text-white/60">
              Incluye {impacto.entregas_por_verificar} entregas que aún esperan verificación.
            </p>
          )}
        </Aparecer>
      </div>
    </section>
  )
}

function PreguntasFrecuentes() {
  const prefiereReducido = useReducedMotion()
  const [abierta, setAbierta] = useState(0)

  return (
    <section id="preguntas" className="scroll-mt-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <Encabezado
        etiqueta="Preguntas frecuentes"
        titulo="Lo que más nos preguntan"
      />

      <div className="space-y-3">
        {PREGUNTAS.map((item, n) => {
          const estaAbierta = abierta === n
          const idRespuesta = `respuesta-${n}`

          return (
            <Aparecer key={item.pregunta} retraso={n * 0.05} desde={16}>
              <div className={`rounded-2xl border transition-colors ${
                estaAbierta
                  ? 'bg-white dark:bg-[#1a2320] border-[#218739]/30 dark:border-[#2fa350]/30 shadow-lg'
                  : 'bg-white/60 dark:bg-[#1a2320]/60 border-gray-100 dark:border-gray-800/40'
              }`}>
                <button
                  type="button"
                  onClick={() => setAbierta(estaAbierta ? -1 : n)}
                  aria-expanded={estaAbierta}
                  aria-controls={idRespuesta}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{item.pregunta}</span>
                  <motion.span
                    animate={{ rotate: estaAbierta ? 45 : 0 }}
                    transition={{ duration: prefiereReducido ? 0 : 0.2 }}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                      estaAbierta
                        ? 'bg-[#218739] dark:bg-[#2fa350] text-white'
                        : 'bg-gray-100 dark:bg-[#121816] text-gray-500'
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {estaAbierta && (
                    <motion.div
                      id={idRespuesta}
                      initial={prefiereReducido ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={prefiereReducido ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm text-gray-600 dark:text-[#a8b3ae] leading-relaxed">
                        {item.respuesta}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Aparecer>
          )
        })}
      </div>
    </section>
  )
}

function LlamadoFinal({ sesionActiva }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <Aparecer>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#176b2b] via-[#218739] to-[#2fa350] p-10 sm:p-14 text-white">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-black/10 blur-3xl" aria-hidden="true" />

          <div className="relative max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              {sesionActiva ? '¿Ya entregaste algo hoy?' : 'Tu barrio también cuenta'}
            </h2>
            <p className="text-white/85 mt-3 text-base leading-relaxed">
              {sesionActiva
                ? 'Busca el punto más cercano, lleva tus materiales y registra la entrega para que sume al impacto de Ciudad Bolívar.'
                : 'Crea tu cuenta gratis para proponer puntos, registrar tus entregas y ayudar a que el mapa esté siempre al día.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={sesionActiva ? '/mapa' : '/register'}
                className="px-6 py-3.5 rounded-2xl bg-white text-[#176b2b] text-sm font-extrabold shadow-lg hover:shadow-xl transition-shadow"
              >
                {sesionActiva ? '♻️ Registrar una entrega' : 'Crear cuenta gratis'}
              </Link>
              <Link
                to="/mapa"
                className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-sm font-bold transition-colors"
              >
                🗺️ Ver el mapa
              </Link>
            </div>
          </div>
        </div>
      </Aparecer>
    </section>
  )
}

function PiePagina({ sesionActiva }) {
  const anio = new Date().getFullYear()

  const claseEnlace = 'text-sm text-gray-500 dark:text-[#a8b3ae] hover:text-[#218739] dark:hover:text-[#2fa350] transition-colors'

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800/50 bg-white dark:bg-[#0b100e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-2">
          <div className="text-[#218739] dark:text-[#2fa350]">
            <Logo className="h-8 w-auto" />
          </div>
          <p className="text-sm text-gray-500 dark:text-[#a8b3ae] mt-4 max-w-sm leading-relaxed">
            El mapa comunitario de puntos de reciclaje, donación de ropa y residuos electrónicos de Ciudad Bolívar, Bogotá.
          </p>
        </div>

        <nav aria-label="Explorar">
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Explorar</p>
          <ul className="space-y-2.5">
            <li><Link to="/mapa" className={claseEnlace}>Mapa de puntos</Link></li>
            <li><Link to="/impacto" className={claseEnlace}>Impacto</Link></li>
            <li><a href="#categorias" onClick={(e) => irASeccion(e, 'categorias')} className={claseEnlace}>Categorías</a></li>
            <li><a href="#como-funciona" onClick={(e) => irASeccion(e, 'como-funciona')} className={claseEnlace}>Cómo funciona</a></li>
            <li><a href="#preguntas" onClick={(e) => irASeccion(e, 'preguntas')} className={claseEnlace}>Preguntas frecuentes</a></li>
          </ul>
        </nav>

        <nav aria-label="Tu cuenta">
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Tu cuenta</p>
          <ul className="space-y-2.5">
            {sesionActiva ? (
              <>
                <li><Link to="/perfil" className={claseEnlace}>Mi perfil</Link></li>
                <li><Link to="/mis-puntos" className={claseEnlace}>Mis puntos</Link></li>
                <li><Link to="/historial" className={claseEnlace}>Mis entregas</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className={claseEnlace}>Iniciar sesión</Link></li>
                <li><Link to="/register" className={claseEnlace}>Crear cuenta</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-400">
          <p>© {anio} eco-TRACE · Ciudad Bolívar, Bogotá</p>
          <p>Fotos: Mussi Katz · Wikimedia Commons (CC0)</p>
        </div>
      </div>
    </footer>
  )
}

// =========================================================
// PÁGINA
// =========================================================

function Home() {
  const [impacto, setImpacto] = useState(null)

  const sesionActiva = Boolean(localStorage.getItem('access_token') && localStorage.getItem('usuario'))

  // Cifras en vivo. Con sesión de administrador llegan además los pendientes.
  useEffect(() => {
    const controlador = new AbortController()
    const token = localStorage.getItem('access_token')

    fetch(`${API_URL}/impacto`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controlador.signal
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((datos) => datos && setImpacto(datos))
      .catch(() => {})

    return () => controlador.abort()
  }, [])

  useEffect(() => {
    document.title = 'eco-TRACE · El mapa verde de Ciudad Bolívar'
  }, [])

  return (
    <div className="min-h-screen bg-[#f1f8f4] dark:bg-[#0f1512] font-sans text-[#333333] dark:text-[#f2f5f3] transition-colors duration-300">
      <Hero impacto={impacto} sesionActiva={sesionActiva} />
      <QueEs />
      <Categorias impacto={impacto} />
      <ComoFunciona />
      {impacto && <ImpactoEnVivo impacto={impacto} />}
      <PreguntasFrecuentes />
      <LlamadoFinal sesionActiva={sesionActiva} />
      <PiePagina sesionActiva={sesionActiva} />
    </div>
  )
}

export default Home
