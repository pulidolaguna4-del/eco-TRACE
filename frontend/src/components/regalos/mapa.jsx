// =========================================================
// MAPAS DE LA SECCIÓN REGALOS
// =========================================================
// - MapaZonas: círculos con la zona aproximada de cada regalo (la API
//   nunca entrega el punto exacto a otros usuarios).
// - SelectorZona: elegir dónde está el regalo al publicarlo, siempre
//   dentro del límite de Ciudad Bolívar (Turf).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Circle, CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { useTheme } from '../../context/ThemeContext'
import { formatearCantidad } from '../../utils/regalos'

const CENTRO_CIUDAD_BOLIVAR = [4.555, -74.155]

const VERDE = '#218739'

const ESTILO_LIMITE = { color: VERDE, weight: 2, fillColor: VERDE, fillOpacity: 0.05, interactive: false }

// El GeoJSON se descarga una vez y se comparte
let promesaLimite = null
// eslint-disable-next-line react-refresh/only-export-components
export function useLimiteCiudadBolivar() {
  const [limite, setLimite] = useState(null)

  useEffect(() => {
    let activo = true
    promesaLimite ??= fetch('/data/ciudadBolivar.geojson')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
    promesaLimite.then((datos) => {
      if (activo) setLimite(datos)
      if (!datos) promesaLimite = null // reintentar la próxima vez
    })
    return () => {
      activo = false
    }
  }, [])

  return limite
}

function Teselas() {
  const { tema } = useTheme()
  return tema === 'dark' ? (
    <TileLayer
      key="oscuro"
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      attribution="&copy; OpenStreetMap contributors &copy; CARTO"
    />
  ) : (
    <TileLayer
      key="claro"
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; OpenStreetMap contributors"
    />
  )
}

// Recentra el mapa cuando cambia el centro pedido
function Recentrar({ centro, zoom }) {
  const mapa = useMap()
  useEffect(() => {
    if (centro) mapa.setView(centro, zoom ?? mapa.getZoom(), { animate: true })
  }, [mapa, centro?.[0], centro?.[1], zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function MapaZonas({ regalos, centro, zoom = 13, puntoExacto = null, conPopup = true, className = 'h-80' }) {
  const limite = useLimiteCiudadBolivar()
  const inicio = centro ?? CENTRO_CIUDAD_BOLIVAR

  return (
    <div className={`relative isolate rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800/60 ${className}`}>
      <MapContainer center={inicio} zoom={zoom} minZoom={11} maxZoom={18} scrollWheelZoom={false} className="w-full h-full">
        <Teselas />
        {centro && <Recentrar centro={centro} zoom={zoom} />}
        {limite && <GeoJSON data={limite} style={ESTILO_LIMITE} />}

        {regalos.map((r) => (
          <Circle
            key={r.id}
            center={[r.zona.latitud, r.zona.longitud]}
            radius={r.zona.radio_m}
            pathOptions={{ color: VERDE, weight: 2, fillColor: '#2fa350', fillOpacity: 0.22 }}
          >
            {conPopup && (
              <Popup>
                <div className="min-w-[10rem]">
                  <p className="font-extrabold text-sm text-gray-900 !m-0">{r.titulo}</p>
                  <p className="text-xs text-gray-600 !mt-0.5 !mb-1.5">
                    {formatearCantidad(r.cantidad, r.unidad)} · 📍 {r.barrio || 'Ciudad Bolívar'}
                  </p>
                  <Link to={`/regalos/${r.id}`} className="text-xs font-bold !text-[#176b2b] hover:underline">
                    Ver el regalo →
                  </Link>
                </div>
              </Popup>
            )}
          </Circle>
        ))}

        {puntoExacto && (
          <CircleMarker
            center={puntoExacto}
            radius={7}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#d97706', fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

function Clics({ onClic }) {
  useMapEvents({ click: (e) => onClic([e.latlng.lat, e.latlng.lng]) })
  return null
}

// valor: [lat, lng] | null
export function SelectorZona({ valor, onElegir, className = 'h-80' }) {
  const limite = useLimiteCiudadBolivar()

  return (
    <div className={`relative isolate rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 cursor-crosshair ${className}`}>
      <MapContainer center={valor ?? CENTRO_CIUDAD_BOLIVAR} zoom={valor ? 15 : 13} minZoom={11} maxZoom={18} className="w-full h-full">
        <Teselas />
        <Clics onClic={(coords) => onElegir(coords, limite)} />
        {valor && <Recentrar centro={valor} />}
        {limite && <GeoJSON data={limite} style={ESTILO_LIMITE} />}
        {valor && (
          <>
            <Circle
              center={valor}
              radius={300}
              pathOptions={{ color: VERDE, weight: 2, dashArray: '6 6', fillColor: '#2fa350', fillOpacity: 0.12 }}
              interactive={false}
            />
            <CircleMarker
              center={valor}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: VERDE, fillOpacity: 1 }}
              interactive={false}
            />
          </>
        )}
      </MapContainer>
      {!valor && (
        <p className="pointer-events-none absolute z-[500] top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1a2320]/95 text-xs font-bold text-gray-800 dark:text-[#f2f5f3] shadow-md whitespace-nowrap">
          👆 Toca el mapa donde está el regalo
        </p>
      )}
    </div>
  )
}
