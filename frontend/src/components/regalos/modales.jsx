// =========================================================
// MODALES DE LA SECCIÓN REGALOS
// =========================================================

import { useState } from 'react'

import { BaseModal, BotonAccion, claseCampo, EncabezadoModal, TarjetaElemento } from '../admin/ui'
import { LIMITES_REGALO, UNIDADES_REGALO } from '../../utils/regalos'

const claseEtiqueta = 'block text-xs font-bold text-gray-700 dark:text-[#dce4e0] mb-1.5'

function Contador({ valor, maximo }) {
  return (
    <span className="text-xs font-bold text-gray-500 dark:text-[#a8b3ae] tabular-nums" aria-hidden="true">
      {valor}/{maximo}
    </span>
  )
}

// ---------------------------------------------------------
// Confirmar una acción (cancelar, liberar, entregar...)
// ---------------------------------------------------------

export function ModalAccion({ icono, titulo, descripcion, textoConfirmar, textoCargando, variante = 'primario', procesando, onCancelar, onConfirmar, children }) {
  return (
    <BaseModal idTitulo="titulo-modal-accion" procesando={procesando} onCancelar={onCancelar}>
      <EncabezadoModal
        id="titulo-modal-accion"
        icono={icono}
        titulo={titulo}
        subtitulo={descripcion}
        onCerrar={onCancelar}
        procesando={procesando}
        tono={variante === 'peligro' ? 'peligro' : 'primario'}
      />
      <div className="px-6 pb-6 space-y-5">
        {children}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <BotonAccion onClick={onCancelar} deshabilitado={procesando} autoFocus>Volver</BotonAccion>
          <BotonAccion variante={variante} onClick={onConfirmar} cargando={procesando} textoCargando={textoCargando}>
            {textoConfirmar}
          </BotonAccion>
        </div>
      </div>
    </BaseModal>
  )
}

// ---------------------------------------------------------
// Reportar una publicación o un mensaje
// ---------------------------------------------------------

const MOTIVO_MIN = 5

export function ModalReporte({ titulo, etiqueta, nombre, detalle, procesando, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const enviar = (e) => {
    e.preventDefault()
    const limpio = motivo.trim()
    if (limpio.length < MOTIVO_MIN) {
      setError(`Escribe al menos ${MOTIVO_MIN} caracteres para explicar el problema.`)
      return
    }
    onConfirmar(limpio)
  }

  return (
    <BaseModal idTitulo="titulo-modal-reporte" procesando={procesando} onCancelar={onCancelar}>
      <EncabezadoModal
        id="titulo-modal-reporte"
        icono="🚩"
        titulo={titulo}
        subtitulo="Un administrador lo revisará. Quien lo publicó no sabrá quién lo reportó."
        onCerrar={onCancelar}
        procesando={procesando}
      />
      <form onSubmit={enviar} className="px-6 pb-6 space-y-5">
        <TarjetaElemento etiqueta={etiqueta} nombre={nombre} detalle={detalle} />

        <div>
          <label htmlFor="motivo-reporte" className={claseEtiqueta}>¿Qué está mal?</label>
          <textarea
            id="motivo-reporte"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setError('')
            }}
            maxLength={LIMITES_REGALO.motivo}
            rows={4}
            autoFocus
            disabled={procesando}
            placeholder="Ej.: es un objeto prohibido, piden dinero, el mensaje es ofensivo…"
            aria-invalid={Boolean(error)}
            aria-describedby="ayuda-motivo-reporte"
            className={`${claseCampo} resize-none`}
          />
          <div className="flex justify-between items-start gap-3 mt-1.5">
            <p id="ayuda-motivo-reporte" className={`text-xs ${error ? 'text-red-700 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-[#a8b3ae]'}`}>
              {error || 'Cuéntanos lo necesario para entender el problema.'}
            </p>
            <Contador valor={motivo.length} maximo={LIMITES_REGALO.motivo} />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <BotonAccion onClick={onCancelar} deshabilitado={procesando}>Cancelar</BotonAccion>
          <BotonAccion tipo="submit" variante="peligro" cargando={procesando} textoCargando="Enviando...">
            Enviar reporte
          </BotonAccion>
        </div>
      </form>
    </BaseModal>
  )
}

// ---------------------------------------------------------
// Editar un regalo (título, descripción, cantidad y barrio)
// ---------------------------------------------------------

export function ModalEditarRegalo({ regalo, procesando, onCancelar, onGuardar }) {
  const [titulo, setTitulo] = useState(regalo.titulo)
  const [descripcion, setDescripcion] = useState(regalo.descripcion ?? '')
  const [cantidad, setCantidad] = useState(String(regalo.cantidad))
  const [unidad, setUnidad] = useState(regalo.unidad)
  const [barrio, setBarrio] = useState(regalo.barrio ?? '')
  const [error, setError] = useState('')

  const guardar = (e) => {
    e.preventDefault()
    const numero = Number(cantidad.replace(',', '.'))
    if (titulo.trim().length < 3) return setError('El título debe tener al menos 3 caracteres.')
    if (!(numero > 0)) return setError('La cantidad debe ser mayor que 0.')
    onGuardar({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      cantidad: numero,
      unidad,
      barrio: barrio.trim() || null
    })
  }

  return (
    <BaseModal idTitulo="titulo-modal-editar" procesando={procesando} onCancelar={onCancelar} ancho="max-w-lg">
      <EncabezadoModal
        id="titulo-modal-editar"
        icono="✏️"
        titulo="Editar regalo"
        subtitulo="La categoría, las fotos y la zona no se pueden cambiar."
        onCerrar={onCancelar}
        procesando={procesando}
        tono="primario"
      />
      <form onSubmit={guardar} className="px-6 pb-6 space-y-4">
        <div>
          <div className="flex justify-between items-end">
            <label htmlFor="editar-titulo" className={claseEtiqueta}>Título</label>
            <Contador valor={titulo.length} maximo={LIMITES_REGALO.titulo} />
          </div>
          <input id="editar-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={LIMITES_REGALO.titulo} disabled={procesando} className={claseCampo} autoFocus />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="editar-cantidad" className={claseEtiqueta}>Cantidad</label>
            <input id="editar-cantidad" inputMode="decimal" value={cantidad} onChange={(e) => setCantidad(e.target.value)} disabled={procesando} className={claseCampo} />
          </div>
          <div>
            <label htmlFor="editar-unidad" className={claseEtiqueta}>Unidad</label>
            <select id="editar-unidad" value={unidad} onChange={(e) => setUnidad(e.target.value)} disabled={procesando} className={claseCampo}>
              {UNIDADES_REGALO.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end">
            <label htmlFor="editar-descripcion" className={claseEtiqueta}>Descripción <span className="font-medium text-gray-500">(opcional)</span></label>
            <Contador valor={descripcion.length} maximo={LIMITES_REGALO.descripcion} />
          </div>
          <textarea id="editar-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={LIMITES_REGALO.descripcion} rows={3} disabled={procesando} className={`${claseCampo} resize-none`} />
        </div>

        <div>
          <label htmlFor="editar-barrio" className={claseEtiqueta}>Barrio <span className="font-medium text-gray-500">(opcional)</span></label>
          <input id="editar-barrio" value={barrio} onChange={(e) => setBarrio(e.target.value)} maxLength={LIMITES_REGALO.barrio} disabled={procesando} className={claseCampo} />
        </div>

        {error && <p role="alert" className="text-xs font-bold text-red-700 dark:text-red-400">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <BotonAccion onClick={onCancelar} deshabilitado={procesando}>Cancelar</BotonAccion>
          <BotonAccion tipo="submit" variante="primario" cargando={procesando}>Guardar cambios</BotonAccion>
        </div>
      </form>
    </BaseModal>
  )
}
