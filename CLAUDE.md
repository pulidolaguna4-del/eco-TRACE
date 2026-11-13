# eco-TRACE — contexto del proyecto

## Qué es
Plataforma web para que los ciudadanos de **Ciudad Bolívar (Bogotá)** encuentren, propongan y usen **puntos ecológicos**: reciclaje, donación de ropa y reciclaje electrónico. Centraliza información dispersa en un mapa, la comunidad la verifica y se fomenta la participación mostrando el impacto generado.

Es un proyecto formativo: el alcance ampliado se valida con el instructor. La documentación de requisitos está en `docs/requisitos/`.

## Flujo principal
1. El usuario se registra o inicia sesión (JWT). Puede recuperar la contraseña con un código enviado por correo.
2. Consulta el **mapa** (React-Leaflet), filtra puntos por categoría y ve el detalle de cada uno.
3. **Propone un punto** marcándolo en el mapa. Turf valida que quede dentro del GeoJSON de Ciudad Bolívar (`frontend/src/data/ciudadBolivar.geojson`). El punto queda en estado `pendiente`.
4. El **administrador** aprueba o rechaza el punto, con motivo de rechazo, y se notifica al usuario por correo.
5. En los puntos aprobados, los usuarios **registran entregas o donaciones** (quedan `pendiente`) y consultan su **historial**. El administrador las marca `verificada` o `rechazada` con motivo.
6. Los usuarios pueden **reportar** información incorrecta de un punto, y el administrador revisa esos reportes.
7. Los usuarios **califican y reseñan** los puntos (1 a 5 estrellas, una reseña por usuario y punto, editable). Muchas reseñas negativas recientes marcan el punto para **revisión prioritaria**.
8. El **dashboard de impacto** (`/impacto`) resume kg reciclados, entregas y puntos activos, con filtro por categoría y datos extra para el administrador.
9. **Regalos** (marketplace gratuito, `/regalos`): los usuarios regalan lo que ya no usan, los interesados chatean en tiempo real con quien regala (Socket.IO) y este reserva y marca la entrega. Solo se publica una zona aproximada. Especificación: `docs/requisitos/Especificacion_Regalos.md`.

Roles: `usuario` y `admin` (columna `es_admin`). Un cambio de rol solo se refleja en el JWT después de volver a iniciar sesión.

## Stack
- **Frontend** (`frontend/`): React 19, Vite, Tailwind 4, React Router 7, Framer Motion, Leaflet / React-Leaflet, Turf.
  - Páginas en `src/pages`: Home, Login, Register, RecuperarPassword, Mapa, Perfil, MisPuntos, Historial, Impacto, Admin, Regalos, RegaloNuevo, RegaloDetalle, MisRegalos y Mensajes. El modal de reseñas está en `src/components/ResenasPunto.jsx`.
  - El chat usa una sola conexión de `socket.io-client` en `src/context/ChatContext.jsx` (no leídos y eventos para toda la app).
- **Backend** (`backend/`): **Express 5 + Prisma 6 + Zod + argon2**, en JavaScript (ESM). Reemplazó al backend FastAPI/SQLModel (PR #42, 2026-11-05); el código Python solo queda en el historial de git.
  - Organizado por capas en `src/`: `routes/` → `controllers/` → `services/` (lógica y Prisma), más `middlewares/` (JWT, admin, validación, errores), `validators/` (Zod) y `utils/` (JWT, argon2, serializadores).
  - Los 27 endpoints heredados conservan las rutas y el formato de respuesta del backend FastAPI. Los errores responden `{ detail }`, y los de validación `422` con `detail: [{ loc, msg }]`, como Pydantic.
  - Endpoints de Tier 1: `PUT /admin/entregas/:id/revisar`, `GET /impacto` (público; `optionalAuth` añade el bloque `admin`), `GET|PUT|DELETE /puntos/:id/resenas` y `PUT /admin/puntos/:id/revision`.
  - Migraciones: `0_init` (baseline del esquema de FastAPI), `1_ajustes_express`, `2_entregas_mer` (campos del MER en `entregas` y estados pendiente/verificada/rechazada, con relleno de datos antiguos), `3_resenas`, `4_google_login` y `5_regalos`. `scripts/migrate.js` las aplica al arrancar el contenedor.
  - El promedio y el total de reseñas se guardan en `puntos` y se recalculan en `resenas.service.js#recalcular`. El umbral se configura con `UMBRAL_RESENAS_NEGATIVAS` (3) y `DIAS_RESENAS_RECIENTES` (30); solo cuentan las negativas posteriores a `fecha_revision`.
  - Las fechas se guardan en UTC y la API las devuelve en ISO 8601 con `Z`; el frontend las muestra en la hora local del navegador.
- **Base de datos**: PostgreSQL 17. Tablas: `usuarios`, `puntos`, `categorias`, `punto_categoria` (un punto tiene varias categorías), `entregas`, `reportes`, `resenas`, `codigos_recuperacion`, `regalos`, `conversaciones`, `mensajes` y `reportes_regalo`.
  - En `mensajes`, los avisos del sistema guardan como `remitente_id` a quien los causó, para que solo cuenten como no leídos para el otro participante.
- **Infraestructura**: `docker compose up --build` levanta db (5432), backend (8000) y frontend (5173). Las variables van en `.env` en la raíz (ignorado por git): `POSTGRES_*`, `SECRET_KEY`, `EMAIL_*`.

## Planeación (docs/requisitos)
- **Requisitos funcionales**: el SRS original cubre RF-001 a RF-010. El anexo `eco-TRACE_RFs_y_Criterio_Priorizacion.docx` agrega RF-011 a RF-020.
- **Backlog**: 23 historias de usuario (HU-01 a HU-23, 70 puntos), repartidas en 5 épicas:
  - Autenticación y perfil (HU-01 a HU-05)
  - Mapa y consulta (HU-06 a HU-12)
  - Propuesta y aprobación (HU-13 a HU-17)
  - Panel administrativo (HU-18 y HU-19)
  - Historial, impacto y calidad del dato (HU-20 a HU-23)
- **Priorización**: WSJF = (Valor + Habilita) / Esfuerzo, ordenado por épica y respetando las dependencias técnicas. Hay 4 sprints de 4 semanas.
- **Tier 1 (historias nuevas)**:
  - HU-20: historial de entregas, con filtro por estado y detalle.
  - HU-21: correo al aprobar o rechazar un punto. Un fallo de envío se registra, pero no bloquea la aprobación.
  - HU-22: dashboard de impacto (kg reciclados, número de donaciones, puntos activos), con filtro por categoría y una vista ampliada para el administrador.
  - HU-23: reseñas de 1 a 5 estrellas con comentario opcional y promedio por punto. Cada usuario edita su propia reseña en lugar de duplicarla. Si un punto supera el umbral de reseñas negativas, se marca para revisión.
- **Fuera de alcance por ahora**: Tier 2 (más localidades, alianzas institucionales, campañas) y Tier 3 (tests, CI, accesibilidad WCAG).

## Diferencias entre los documentos y el código (al 2026-11-10)
HU-20, HU-22 y HU-23 ya están implementadas. Lo que todavía difiere del MER y los documentos:
- No existe la tabla `NOTIFICACION`.
- Los correos se envían por SMTP (Gmail/nodemailer). Los documentos hablan de Resend.
- `entregas` conserva `tipo`, `cantidad` y `unidad` (además de los campos del MER) por compatibilidad. En kg, `peso` = `cantidad`; en prendas o unidades el peso es opcional y solo suma al dashboard si se indica.

## Convenciones
- Todo el código, los nombres de tablas y campos y los textos de la interfaz van en **español** (`usuario_id`, `fecha_creacion`, `motivo_rechazo`...).
- Los cambios de esquema se hacen editando `schema.prisma` y ejecutando `npx prisma migrate dev --name <descripcion>`.
