import { useEffect, useState } from 'react'

function Admin() {
  const [puntosPendientes, setPuntosPendientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [puntosAprobados, setPuntosAprobados] = useState([])

  const [cargando, setCargando] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(null)

  const cargarDatosDashboard = async () => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Debes iniciar sesión como administrador')
      setCargando(false)
      return
    }

    try {
      setCargando(true)
      setError('')
      setMensaje('')

      // 1. Obtener puntos pendientes
      const resPendientes = await fetch(
        'http://127.0.0.1:8000/admin/puntos/pendientes',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!resPendientes.ok) {
        if (resPendientes.status === 401) {
          setError('Debes iniciar sesión')
          return
        }
        if (resPendientes.status === 403) {
          setError('Debes iniciar sesión como administrador')
          return
        }
        throw new Error('Error al cargar puntos pendientes')
      }
      const datosPendientes = await resPendientes.json()
      setPuntosPendientes(datosPendientes)

      // 2. Obtener usuarios (para la métrica de usuarios registrados)
      const resUsuarios = await fetch(
        'http://127.0.0.1:8000/usuarios',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (resUsuarios.ok) {
        const datosUsuarios = await resUsuarios.json()
        setUsuarios(datosUsuarios)
      }

      // 3. Obtener puntos aprobados (para la métrica)
      const resAprobados = await fetch(
        'http://127.0.0.1:8000/puntos'
      )
      if (resAprobados.ok) {
        const datosAprobados = await resAprobados.json()
        setPuntosAprobados(datosAprobados)
      }

    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatosDashboard()
  }, [])

  const cambiarEstado = async (puntoId, accion) => {
    const token = localStorage.getItem('access_token')

    if (!token) {
      setError('Tu sesión ha expirado')
      return
    }

    try {
      setProcesando(puntoId)
      setError('')
      setMensaje('')

      const respuesta = await fetch(
        `http://127.0.0.1:8000/admin/puntos/${puntoId}/${accion}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.detail || 'No se pudo actualizar el estado del punto'
        )
      }

      if (accion === 'aprobar') {
        setMensaje('Punto aprobado correctamente')
        // Si se aprueba, lo agregamos a los puntos aprobados y lo quitamos de pendientes
        if (datos) {
          setPuntosAprobados((prev) => [...prev, datos])
        }
      } else {
        setMensaje('Punto rechazado correctamente')
      }

      setPuntosPendientes((puntosActuales) =>
        puntosActuales.filter((punto) => punto.id !== puntoId)
      )
    } catch (error) {
      console.error(error)
      setError(error.message)
    } finally {
      setProcesando(null)
    }
  }

  // Métricas
  const totalUsuarios = usuarios.length
  const totalPendientes = puntosPendientes.length
  const totalAprobados = puntosAprobados.length
  const totalPuntos = totalPendientes + totalAprobados

  // Porcentaje para visualización simple de aprobado vs pendiente
  const porcentajeAprobados = totalPuntos > 0 ? Math.round((totalAprobados / totalPuntos) * 100) : 0
  const porcentajePendientes = totalPuntos > 0 ? Math.round((totalPendientes / totalPuntos) * 100) : 0

  return (
    <div className="min-h-screen bg-[#f1f8f4] text-[#333333] font-sans">
      {/* Header del Dashboard */}
      <header className="bg-white border-b border-gray-100 py-6 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌱</span>
              <h1 className="text-2xl font-bold tracking-tight text-[#222222]">eco-TRACE</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">Panel de Control y Administración General</p>
          </div>
          <button
            type="button"
            onClick={cargarDatosDashboard}
            className="self-start md:self-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#218739] hover:bg-[#176b2b] rounded-lg shadow-sm transition-colors duration-150 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#218739]"
          >
            Actualizar datos
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Mensajes de feedback */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-[#d93025] rounded-r-lg text-sm text-[#d93025] flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-[#218739] rounded-r-lg text-sm text-[#218739] flex items-center gap-2">
            <span className="font-semibold">Éxito:</span> {mensaje}
          </div>
        )}

        {/* Sección de Métricas */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> Resumen del Sistema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Tarjeta 1: Usuarios */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Usuarios Registrados</span>
                <span className="p-2 rounded-lg bg-blue-50 text-blue-600 text-lg">👥</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-[#222222]">{cargando ? '...' : totalUsuarios}</p>
                <p className="text-xs text-gray-400 mt-1">Ciudadanos activos</p>
              </div>
            </div>

            {/* Tarjeta 2: Puntos Pendientes */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Puntos Pendientes</span>
                <span className="p-2 rounded-lg bg-amber-50 text-amber-600 text-lg">⏳</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-[#222222]">{cargando ? '...' : totalPendientes}</p>
                <p className="text-xs text-amber-600 font-medium mt-1">Requieren moderación</p>
              </div>
            </div>

            {/* Tarjeta 3: Puntos Aprobados */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Puntos Aprobados</span>
                <span className="p-2 rounded-lg bg-green-50 text-green-600 text-lg font-bold">✓</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-[#222222]">{cargando ? '...' : totalAprobados}</p>
                <p className="text-xs text-green-600 font-medium mt-1">Visibles en el mapa</p>
              </div>
            </div>

            {/* Tarjeta 4: Total */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total de Puntos</span>
                <span className="p-2 rounded-lg bg-gray-50 text-gray-600 text-lg">🌱</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-extrabold text-[#222222]">{cargando ? '...' : totalPuntos}</p>
                <p className="text-xs text-gray-400 mt-1">Registrados en total</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bloque de Comparación Visual Simple */}
        <section className="mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribución de Puntos Ecológicos</h3>
            {totalPuntos > 0 ? (
              <div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${porcentajeAprobados}%` }}
                    className="bg-[#218739] transition-all duration-500"
                    title={`Aprobados: ${porcentajeAprobados}%`}
                  ></div>
                  <div
                    style={{ width: `${porcentajePendientes}%` }}
                    className="bg-amber-400 transition-all duration-500"
                    title={`Pendientes: ${porcentajePendientes}%`}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#218739] inline-block"></span>
                    <span>Aprobados: <strong>{totalAprobados}</strong> ({porcentajeAprobados}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    <span>Pendientes: <strong>{totalPendientes}</strong> ({porcentajePendientes}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay puntos ecológicos registrados todavía.</p>
            )}
          </div>
        </section>

        {/* Listado de Puntos Pendientes */}
        <section>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-800">Puntos Pendientes de Verificación</h3>
                <p className="text-xs text-gray-500 mt-1">Revisa detalladamente la información antes de aprobar o rechazar.</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                {totalPendientes} por revisar
              </span>
            </div>

            {cargando ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-[#218739]/30 border-t-[#218739] rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 font-medium">Cargando puntos pendientes...</p>
              </div>
            ) : puntosPendientes.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl">🎉</span>
                <h4 className="text-lg font-bold text-gray-800 mt-4">¡Todo al día!</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  No hay puntos pendientes de verificación en este momento. Todos los envíos comunitarios han sido moderados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Nombre y Tipo</th>
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4">Ubicación / Coordenadas</th>
                      <th className="px-6 py-4">Creado por</th>
                      <th className="px-6 py-4 text-right">Acciones de moderación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {puntosPendientes.map((punto) => (
                      <tr key={punto.id} className="hover:bg-gray-50/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm">{punto.nombre}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-bold tracking-wide rounded bg-[#f1f8f4] text-[#218739] border border-[#218739]/10 uppercase">
                            {punto.tipo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-600 max-w-xs line-clamp-2" title={punto.descripcion}>
                            {punto.descripcion}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-900 font-semibold">{punto.direccion}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{punto.localidad}</div>
                          <div className="text-[10px] text-gray-400 mt-1 font-mono">
                            {punto.latitud.toFixed(5)}, {punto.longitud.toFixed(5)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          ID Usuario: <span className="font-semibold text-gray-700">{punto.usuario_id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={procesando === punto.id}
                              onClick={() => cambiarEstado(punto.id, 'aprobar')}
                              className="inline-flex items-center justify-center px-3 py-1.5 font-bold rounded-lg text-white bg-[#218739] hover:bg-[#176b2b] disabled:bg-gray-300 transition-colors duration-150 shadow-xs cursor-pointer"
                            >
                              {procesando === punto.id ? '...' : 'Aprobar'}
                            </button>
                            <button
                              type="button"
                              disabled={procesando === punto.id}
                              onClick={() => cambiarEstado(punto.id, 'rechazar')}
                              className="inline-flex items-center justify-center px-3 py-1.5 font-bold rounded-lg text-white bg-[#d93025] hover:bg-[#b3261e] disabled:bg-gray-300 transition-colors duration-150 shadow-xs cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Admin
