// =========================================================
// UBICACIÓN, BÚSQUEDA DE DIRECCIONES Y RUTAS
// =========================================================
// Servicios gratuitos de OpenStreetMap, sin clave:
// - Nominatim: dirección -> coordenadas y coordenadas -> dirección.
//   Política de uso: máximo 1 petición por segundo y nada de
//   autocompletar en cada tecla (por eso se busca al enviar).
// - Servidores OSRM de FOSSGIS: rutas en carro y a pie.

import booleanPointInPolygon from '@turf/boolean-point-in-polygon'

const NOMINATIM = 'https://nominatim.openstreetmap.org'

const SERVIDORES_RUTA = {
  carro: [
    'https://routing.openstreetmap.de/routed-car',
    'https://router.project-osrm.org'
  ],
  pie: ['https://routing.openstreetmap.de/routed-foot']
}

// ---------------------------------------------------------
// Límite de Ciudad Bolívar
// ---------------------------------------------------------

export function estaEnCiudadBolivar([lat, lng], limite) {
  if (!limite) return false

  return booleanPointInPolygon(
    { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} },
    limite
  )
}

// [oeste, sur, este, norte] del GeoJSON
export function cajaDelLimite(limite) {
  let [oeste, sur, este, norte] = [Infinity, Infinity, -Infinity, -Infinity]

  const recorrer = (coords) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords
      oeste = Math.min(oeste, lng)
      este = Math.max(este, lng)
      sur = Math.min(sur, lat)
      norte = Math.max(norte, lat)
      return
    }
    coords.forEach(recorrer)
  }

  const geometrias = limite?.type === 'FeatureCollection'
    ? limite.features.map((f) => f.geometry)
    : [limite?.geometry ?? limite]

  geometrias.forEach((g) => g?.coordinates && recorrer(g.coordinates))

  return [oeste, sur, este, norte]
}

// ---------------------------------------------------------
// Ubicación actual del navegador
// ---------------------------------------------------------

const MENSAJE_PERMISO =
  'No diste permiso para usar tu ubicación. Actívalo en el candado de la barra de direcciones del navegador y vuelve a intentarlo.'

function pedirPosicion(opciones) {
  return new Promise((resolver, rechazar) =>
    navigator.geolocation.getCurrentPosition(resolver, rechazar, opciones)
  )
}

// Devuelve { coords: [lat, lng], precision (metros) }
export async function obtenerPosicionActual() {
  if (!window.isSecureContext) {
    throw new Error('La ubicación solo funciona abriendo la página en localhost o con https.')
  }
  if (!('geolocation' in navigator)) {
    throw new Error('Tu navegador no permite obtener tu ubicación.')
  }

  let posicion

  try {
    // Primero con GPS (más precisa)...
    posicion = await pedirPosicion({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
  } catch (error) {
    if (error.code === 1) throw new Error(MENSAJE_PERMISO)

    // ...y si tarda o falla, con la ubicación aproximada (wifi / red)
    try {
      posicion = await pedirPosicion({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 })
    } catch (segundo) {
      if (segundo.code === 1) throw new Error(MENSAJE_PERMISO)
      throw new Error(
        segundo.code === 3
          ? 'Se agotó el tiempo para obtener tu ubicación. Intenta de nuevo.'
          : 'No se pudo determinar tu ubicación. Activa el GPS o la ubicación del equipo.'
      )
    }
  }

  return {
    coords: [posicion.coords.latitude, posicion.coords.longitude],
    precision: Math.round(posicion.coords.accuracy)
  }
}

// ---------------------------------------------------------
// Direcciones (Nominatim)
// ---------------------------------------------------------

const ABREVIATURAS = [
  [/\b(?:cra|kra|kr|cr|carr)\b\.?/gi, 'Carrera'],
  [/\b(?:cll|cl|clle)\b\.?/gi, 'Calle'],
  [/\b(?:dg|diag)\b\.?/gi, 'Diagonal'],
  [/\b(?:tv|tr|transv|trans)\b\.?/gi, 'Transversal'],
  [/\b(?:av|avda)\b\.?/gi, 'Avenida']
]

function normalizar(texto) {
  let limpio = texto.replace(/\s+/g, ' ').trim()
  for (const [patron, reemplazo] of ABREVIATURAS) {
    limpio = limpio.replace(patron, reemplazo)
  }
  return limpio
}

function conCiudad(texto) {
  return /bogot/i.test(texto) ? texto : `${texto}, Bogotá`
}

// "Calle 70 Sur 18M-50, Arborizadora Alta"
function etiquetaCorta(resultado) {
  const a = resultado.address ?? {}
  const via = [a.road, a.house_number].filter(Boolean).join(' ')
  const barrio = a.neighbourhood || a.suburb || a.quarter || a.residential
  const partes = [via || resultado.name, barrio].filter(Boolean)

  return partes.length
    ? partes.join(', ')
    : resultado.display_name.split(',').slice(0, 3).join(',')
}

async function consultarNominatim(ruta, parametros) {
  const url = new URL(`${NOMINATIM}/${ruta}`)
  Object.entries({ format: 'jsonv2', addressdetails: 1, 'accept-language': 'es', ...parametros })
    .forEach(([clave, valor]) => url.searchParams.set(clave, valor))

  const respuesta = await fetch(url)
  if (!respuesta.ok) {
    throw new Error('El servicio de direcciones no respondió. Intenta en unos segundos.')
  }
  return respuesta.json()
}

// Busca una dirección dentro de Ciudad Bolívar. Si la dirección completa
// no aparece (pasa con las placas "# 18M-50"), busca solo la vía.
// Devuelve [{ coords: [lat, lng], etiqueta, aproximada }]
export async function buscarDireccion(texto, limite) {
  const [oeste, sur, este, norte] = cajaDelLimite(limite)
  const comun = {
    limit: 6,
    countrycodes: 'co',
    bounded: 1,
    viewbox: `${oeste},${norte},${este},${sur}`
  }

  // "#", "Nº 12" y "No. 12" separan la vía de la placa
  const completa = normalizar(texto.replace(/#|N[º°](?=\s*\d)|\bNo\.(?=\s*\d)/g, ' '))
  const soloVia = normalizar(texto.split('#')[0])

  const tienePlaca = /#|N[º°]\s*\d|\bNo\.\s*\d/.test(texto)

  const intentos = [{ q: completa, aproximada: false }]
  if (texto.includes('#') && soloVia && soloVia !== completa) {
    intentos.push({ q: soloVia, aproximada: true })
  }

  for (const intento of intentos) {
    const resultados = await consultarNominatim('search', { ...comun, q: conCiudad(intento.q) })

    const dentro = resultados
      .map((r) => ({
        coords: [Number(r.lat), Number(r.lon)],
        etiqueta: etiquetaCorta(r),
        // Si escribió una placa y el resultado es solo la vía, es aproximado
        aproximada: intento.aproximada || (tienePlaca && !r.address?.house_number)
      }))
      .filter((r) => estaEnCiudadBolivar(r.coords, limite))

    if (dentro.length) return dentro
  }

  return []
}

// Dirección legible de unas coordenadas (para prellenar el formulario)
export async function direccionDeCoordenadas([lat, lng]) {
  try {
    const resultado = await consultarNominatim('reverse', { lat, lon: lng, zoom: 18 })
    return resultado?.address ? etiquetaCorta(resultado) : ''
  } catch {
    return ''
  }
}

// ---------------------------------------------------------
// Rutas (OSRM)
// ---------------------------------------------------------

// modo: "carro" | "pie". Devuelve { coordenadas: [[lat, lng]...], distancia (m), duracion (s) }
export async function calcularRuta([latO, lngO], [latD, lngD], modo = 'carro') {
  let ultimoError

  for (const base of SERVIDORES_RUTA[modo]) {
    try {
      const url =
        `${base}/route/v1/driving/${lngO},${latO};${lngD},${latD}` +
        '?overview=full&geometries=geojson'

      const respuesta = await fetch(url)
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)

      const datos = await respuesta.json()
      const ruta = datos.routes?.[0]
      if (!ruta) throw new Error('Sin ruta')

      return {
        coordenadas: ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distancia: ruta.distance,
        duracion: ruta.duration
      }
    } catch (error) {
      ultimoError = error
    }
  }

  console.error('No se pudo calcular la ruta:', ultimoError)
  throw new Error('No se encontró una ruta hasta este punto. Intenta de nuevo en unos segundos.')
}

// Enlace para seguir la ruta paso a paso en Google Maps
export function enlaceGoogleMaps([latO, lngO], [latD, lngD], modo = 'carro') {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', `${latO},${lngO}`)
  url.searchParams.set('destination', `${latD},${lngD}`)
  url.searchParams.set('travelmode', modo === 'pie' ? 'walking' : 'driving')
  return url.toString()
}
