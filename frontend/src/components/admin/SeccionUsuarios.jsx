// =========================================================
// USUARIOS
// =========================================================
// Tarjeta por usuario con su rol y lo que ha aportado. Desde aquí se
// dan o quitan permisos de administrador y se eliminan cuentas.

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

import { claseTarjeta, Avatar, BotonAccion, Buscador, EstadoVacio, Esqueleto, FiltroChips, Insignia } from './ui'
import { coincide, variantesItem } from './utilidades'

export default function SeccionUsuarios({
  usuarios,
  todosLosPuntos,
  entregas,
  miUsuarioId,
  filtro,
  onFiltro,
  busqueda,
  onBusqueda,
  usuarioProcesandoId,
  onCambiarAdmin,
  onEliminar,
  cargando
}) {
  const reducido = useReducedMotion()
  const variantes = variantesItem(reducido)

  const admins = usuarios.filter((u) => u.es_admin).length
  const opciones = [
    { id: 'todos', nombre: 'Todos', total: usuarios.length },
    { id: 'admin', nombre: 'Administradores', total: admins },
    { id: 'usuario', nombre: 'Usuarios', total: usuarios.length - admins }
  ]

  const visibles = usuarios
    .filter((u) => (filtro === 'todos' ? true : filtro === 'admin' ? u.es_admin : !u.es_admin))
    .filter((u) => !busqueda || [u.nombre, u.correo, `#${u.id}`].some((t) => coincide(t, busqueda)))
    .sort((a, b) => Number(b.id === miUsuarioId) - Number(a.id === miUsuarioId) || Number(Boolean(b.es_admin)) - Number(Boolean(a.es_admin)))

  return (
    <div className="space-y-4">
      <div className={`${claseTarjeta} p-4 flex flex-col gap-3`}>
        <Buscador valor={busqueda} onCambiar={onBusqueda} placeholder="Buscar por nombre o correo" />
        <FiltroChips opciones={opciones} valor={filtro} onCambiar={onFiltro} etiqueta="Filtrar usuarios por rol" />
      </div>

      <p className="flex items-start gap-2 text-xs text-gray-600 dark:text-[#a8b3ae] px-1">
        <span aria-hidden="true">ℹ️</span>
        Los cambios de rol se aplican la próxima vez que la persona inicie sesión.
      </p>

      {cargando ? (
        <Esqueleto filas={3} />
      ) : visibles.length === 0 ? (
        <EstadoVacio icono="👥" titulo="Ningún usuario coincide" descripcion="Prueba con otra búsqueda o cambia el filtro." />
      ) : (
        <ul className="grid sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {visibles.map((usuario) => {
              const esMiCuenta = usuario.id === miUsuarioId
              const procesando = usuarioProcesandoId === usuario.id
              const puntos = todosLosPuntos.filter((p) => p.usuario_id === usuario.id).length
              const aportes = entregas.filter((e) => e.usuario_id === usuario.id).length

              return (
                <motion.li
                  key={usuario.id}
                  layout={!reducido}
                  variants={variantes}
                  initial="oculto"
                  animate="visible"
                  exit="salida"
                  className={`${claseTarjeta} p-5 flex flex-col`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar nombre={usuario.nombre} tamaño="lg" admin={usuario.es_admin} />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-gray-900 dark:text-white truncate">
                        {usuario.nombre}
                        {esMiCuenta && <span className="ml-2 text-xs font-bold text-[#218739] dark:text-[#2fa350]">(tú)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] truncate">{usuario.correo}</p>
                      <div className="mt-2">
                        {usuario.es_admin ? <Insignia tipo="admin">👑 Administrador</Insignia> : <Insignia tipo="neutro">Usuario</Insignia>}
                      </div>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-gray-50 dark:bg-[#0f1512] px-3 py-2">
                      <dt className="text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae]">Puntos propuestos</dt>
                      <dd className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{puntos}</dd>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-[#0f1512] px-3 py-2">
                      <dt className="text-[11px] font-bold text-gray-500 dark:text-[#a8b3ae]">Entregas</dt>
                      <dd className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{aportes}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 flex gap-2">
                    {esMiCuenta ? (
                      <p className="text-xs text-gray-500 dark:text-[#a8b3ae] py-2">No puedes cambiar tu propio rol ni eliminar tu cuenta desde aquí.</p>
                    ) : (
                      <>
                        <BotonAccion
                          className="flex-1"
                          variante={usuario.es_admin ? 'secundario' : 'admin'}
                          onClick={() => onCambiarAdmin(usuario.id)}
                          cargando={procesando}
                          deshabilitado={usuarioProcesandoId !== null && !procesando}
                        >
                          {usuario.es_admin ? 'Quitar admin' : '👑 Hacer admin'}
                        </BotonAccion>
                        <BotonAccion
                          variante="contornoPeligro"
                          onClick={() => onEliminar(usuario)}
                          deshabilitado={usuarioProcesandoId !== null}
                          aria-label={`Eliminar la cuenta de ${usuario.nombre}`}
                        >
                          🗑️
                        </BotonAccion>
                      </>
                    )}
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
