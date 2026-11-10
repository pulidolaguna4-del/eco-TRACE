// Piezas reutilizadas por los formularios de inicio de sesión y registro

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { claseCampo } from './estilos'

// Campo de contraseña con botón para ver u ocultar lo escrito
export function CampoContrasena({ id, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${claseCampo} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-[#218739] dark:hover:text-[#2fa350] cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {visible ? (
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M1 1l22 22" />
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}

// Aviso de error o de éxito bajo el formulario
export function MensajeFormulario({ mensaje, esError }) {
  return (
    <AnimatePresence mode="wait">
      {mensaje && (
        <motion.div
          key={mensaje}
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.25 }}
          role={esError ? 'alert' : 'status'}
          className={`mt-5 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            esError
              ? 'bg-red-50 dark:bg-red-950/20 text-[#d93025] dark:text-[#ef5350] border border-red-100 dark:border-red-900/30'
              : 'bg-green-50 dark:bg-green-950/20 text-[#218739] dark:text-[#2fa350] border border-green-100 dark:border-green-900/30'
          }`}
        >
          <span>{esError ? '⚠️' : '🎉'}</span>
          <span>{mensaje}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Botón de envío con estado de carga
export function BotonEnviar({ cargando, texto, textoCargando, className }) {
  return (
    <button type="submit" disabled={cargando} className={className}>
      {cargando ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{textoCargando}</span>
        </>
      ) : (
        <span>{texto}</span>
      )}
    </button>
  )
}

export function Separador() {
  return (
    <div className="flex items-center gap-4 my-7" aria-hidden="true">
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">o</span>
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
    </div>
  )
}

export function EnlaceSecundario({ to, icono, children }) {
  return (
    <Link
      to={to}
      className="w-full py-3 px-4 rounded-xl text-sm font-bold text-gray-700 dark:text-[#f2f5f3] bg-white dark:bg-[#1a2320] border border-gray-200 dark:border-gray-800 hover:border-[#218739]/50 dark:hover:border-[#2fa350]/50 transition-colors flex items-center justify-center gap-2"
    >
      <span aria-hidden="true">{icono}</span>
      {children}
    </Link>
  )
}
