import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const [puntos, setPuntos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [esAdmin, setEsAdmin] = useState(false)

  useEffect(() => {
    // =====================================================
    // COMPROBAR USUARIO
    // =====================================================
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado)
        setEsAdmin(usuario.es_admin === true)
      } catch (error) {
        console.error('Error leyendo usuario:', error)
      }
    }

    // =====================================================
    // CARGAR PUNTOS
    // =====================================================
    const cargarPuntos = async () => {
      try {
        const respuesta = await fetch('http://127.0.0.1:8000/puntos')
        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los puntos')
        }
        const datos = await respuesta.json()
        setPuntos(datos)
      } catch (error) {
        console.error(error)
        setError('No se pudieron cargar los puntos')
      } finally {
        setCargando(false)
      }
    }

    cargarPuntos()
  }, [])

  return (
    <div className="min-h-screen bg-[#f1f8f4] font-sans text-[#333333]">
      {/* HERO SECTION LLAMATIVA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#218739] via-[#1b7230] to-[#125321] text-white py-20 px-4 sm:px-6 lg:px-8 shadow-inner">
        {/* Elemento decorativo flotante */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold mb-6 uppercase tracking-wider backdrop-blur-xs">
            🌱 Sostenibilidad Ciudadana Activa
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Conecta, Recicla y Transforma con <span className="text-[#a5f3fc]">eco-TRACE</span>
          </h1>
          <p className="text-lg sm:text-xl text-emerald-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            La red comunitaria de puntos ecológicos verificados. Encuentra, registra y valida lugares de reciclaje, donación de ropa y desecho electrónico en tu ciudad.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/mapa')}
              className="px-8 py-3.5 bg-white text-[#218739] hover:bg-emerald-50 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
            >
              Explorar el Mapa
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 bg-[#218739] hover:bg-[#176b2b] text-white border border-white/30 text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer"
            >
              Únete a la Comunidad
            </button>
          </div>
        </div>
      </section>

      {/* METRICAS DE IMPACTO AMBIENTAL */}
      <section className="max-w-7xl mx-auto -mt-10 px-4 sm:px-6 lg:px-8 mb-16 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="text-center sm:pb-0 pb-6">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#218739] mb-1">
              {cargando ? '...' : puntos.length}
            </div>
            <div className="text-sm font-bold text-gray-700">Puntos Verificados</div>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Centros de acopio y donación listos para recibir tus residuos.</p>
          </div>
          <div className="text-center pt-6 sm:pt-0 sm:pb-0 pb-6">
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-600 mb-1">100%</div>
            <div className="text-sm font-bold text-gray-700">Confianza Comunitaria</div>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Toda la información es validada por un equipo de moderadores autorizados.</p>
          </div>
          <div className="text-center pt-6 sm:pt-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 mb-1">3+</div>
            <div className="text-sm font-bold text-gray-700">Categorías de Residuos</div>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Clasificados en reciclables tradicionales, ropa y residuos electrónicos.</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE OPCIONES Y ACCIONES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">¿Qué deseas hacer hoy?</h2>
          <p className="text-sm text-gray-500 mt-2">Interactúa con la plataforma y sé parte del cambio ecológico.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* MAPA CARD */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-200">
                🗺️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Explorar el Mapa</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Descubre de forma visual todos los puntos de acopio autorizados más cercanos a tu ubicación. Filtra por tipo de material.
              </p>
            </div>
            <button
              onClick={() => navigate('/mapa')}
              className="w-full py-3 bg-[#218739] hover:bg-[#176b2b] text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-colors duration-150 cursor-pointer"
            >
              Ver mapa interactivo
            </button>
          </div>

          {/* AGREGAR PUNTO CARD */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-200">
                ➕
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Agregar Nuevo Punto</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                ¿Conoces un punto de reciclaje que no está registrado? Regístralo en unos simples pasos para que los administradores lo verifiquen.
              </p>
            </div>
            <button
              onClick={() => navigate('/agregar-punto')}
              className="w-full py-3 bg-white hover:bg-gray-50 text-[#218739] border border-gray-200 text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              Registrar punto ecológico
            </button>
          </div>

          {/* RECICLAJE CARD */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-200">
                ♻️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aprender y Clasificar</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Consulta los diferentes tipos de materiales admitidos y aprende guías rápidas de clasificación para maximizar tu impacto positivo.
              </p>
            </div>
            <button
              onClick={() => navigate('/mapa')}
              className="w-full py-3 bg-white hover:bg-gray-50 text-[#218739] border border-gray-200 text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              Guía de materiales
            </button>
          </div>

          {/* PANEL ADMIN (SOLO VISIBLE SI ES ADMIN) */}
          {esAdmin && (
            <div className="sm:col-span-2 lg:col-span-3 bg-amber-50/50 border border-amber-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xs">
              <div className="flex gap-4 items-start">
                <div className="text-3xl p-3 bg-amber-100 rounded-xl">🛡️</div>
                <div>
                  <h3 className="text-lg font-bold text-amber-900">Módulo de Moderación Activado</h3>
                  <p className="text-sm text-amber-800 mt-1 max-w-xl">
                    Tienes permisos de administrador. Tienes solicitudes pendientes enviadas por la comunidad que requieren tu supervisión.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="shrink-0 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md transition-colors duration-150 cursor-pointer"
              >
                Ir al Panel Admin
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LISTADO DE PUNTOS DISPONIBLES (APROBADOS) */}
      <section className="bg-white border-t border-gray-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Puntos Ecológicos Destacados</h2>
            <p className="text-sm text-gray-500 mt-2">Ubicaciones activas y completamente validadas dentro de la ciudad.</p>
          </div>

          {/* CARGANDO */}
          {cargando && (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-[#218739]/30 border-t-[#218739] rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium">Cargando puntos ecológicos...</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-100 rounded-xl text-center text-sm text-[#d93025]">
              {error}
            </div>
          )}

          {/* SIN PUNTOS */}
          {!cargando && !error && puntos.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl">🍃</span>
              <p className="text-sm text-gray-500 mt-4 font-semibold">No hay puntos disponibles todavía.</p>
            </div>
          )}

          {/* LISTA DE PUNTOS */}
          {!cargando && !error && puntos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {puntos.map((punto) => (
                <div
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  key={punto.id}
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="p-2.5 bg-[#f1f8f4] rounded-lg text-xl">
                        {punto.tipo.toLowerCase().includes('electr') ? '🔌' : punto.tipo.toLowerCase().includes('ropa') ? '👕' : '♻️'}
                      </div>
                      <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded bg-[#f1f8f4] text-[#218739] border border-[#218739]/10">
                        {punto.tipo}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{punto.nombre}</h3>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-6" title={punto.descripcion}>
                      {punto.descripcion}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">📍 Dir:</span>
                      <span className="font-semibold">{punto.direccion}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 font-medium shrink-0">🏙️ Loc:</span>
                      <span className="font-semibold">{punto.localidad}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
