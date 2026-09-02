import React from 'react'
import { CATEGORIAS_DISPONIBLES } from '../utils/puntoUtils'

export function CategoriaBadge({ categoria }) {
  const catInfo = CATEGORIAS_DISPONIBLES.find(
    (c) => c.id.toLowerCase() === categoria?.toLowerCase() ||
           c.nombre.toLowerCase() === categoria?.toLowerCase()
  )

  const icono = catInfo ? catInfo.icono : '🏷️'
  const nombre = catInfo ? catInfo.id : categoria

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-lg bg-[#f1f8f4] dark:bg-[#0f1512] text-[#218739] dark:text-[#2fa350] border border-green-200 dark:border-green-900/30">
      <span>{icono}</span>
      <span>{nombre}</span>
    </span>
  )
}

export function CategoriasBadges({ categorias = [], maxVisibles = 3 }) {
  if (!categorias || categorias.length === 0) return null

  const visibles = categorias.slice(0, maxVisibles)
  const restantes = categorias.length - maxVisibles

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {visibles.map((cat, idx) => (
        <CategoriaBadge key={idx} categoria={cat} />
      ))}
      {restantes > 0 && (
        <span
          className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-extrabold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-[#a8b3ae] cursor-help"
          title={categorias.slice(maxVisibles).join(', ')}
        >
          +{restantes}
        </span>
      )}
    </div>
  )
}
