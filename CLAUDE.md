# eco-TRACE — contexto del proyecto

## Qué es
Plataforma web para que los ciudadanos de **Ciudad Bolívar (Bogotá)** encuentren, propongan y usen **puntos ecológicos**: reciclaje, donación de ropa y reciclaje electrónico. Centraliza información dispersa en un mapa, la comunidad la verifica y se fomenta la participación mostrando el impacto generado.

Es un proyecto formativo: el alcance ampliado se valida con el instructor. La documentación de requisitos está en `docs/requisitos/`.

## Flujo principal
1. El usuario se registra o inicia sesión (JWT). Puede recuperar la contraseña con un código enviado por correo.
2. Consulta el **mapa** (React-Leaflet), filtra puntos por categoría y ve el detalle de cada uno.
3. **Propone un punto** marcándolo en el mapa. Turf valida que quede dentro del GeoJSON de Ciudad Bolívar (`frontend/src/data/ciudadBolivar.geojson`). El punto queda en estado `pendiente`.
4. El **administrador** aprueba o rechaza el punto, con motivo de rechazo, y se notifica al usuario por correo.
5. En los puntos aprobados, los usuarios **registran entregas o donaciones** y consultan su **historial**.
6. Los usuarios pueden **reportar** información incorrecta de un punto, y el administrador revisa esos reportes.

Roles: `usuario` y `admin` (columna `es_admin`). Un cambio de rol solo se refleja en el JWT después de volver a iniciar sesión.

## Stack
- **Frontend** (`frontend/`): React 19, Vite, Tailwind 4, React Router 7, Framer Motion, Leaflet / React-Leaflet, Turf.
  - Páginas en `src/pages`: Home, Login, Register, RecuperarPassword, Mapa, Perfil, MisPuntos, Historial, Admin.
- **Backend** (`backend/`): **en migración de FastAPI/SQLModel a Express 5 + Prisma 6 + Zod + argon2** (rama `feat/backend-express`).
  - El backend FastAPI original (`backend/app/main.py`, unos 27 endpoints) sigue en `main` como referencia.
  - El esquema Prisma (`backend/prisma/schema.prisma`) replica exactamente las tablas que creaba FastAPI, para no romper la base existente.
- **Base de datos**: PostgreSQL 17. Tablas: `usuarios`, `puntos`, `categorias`, `punto_categoria` (un punto tiene varias categorías), `entregas`, `reportes` y `codigos_recuperacion`.
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

## Diferencias entre los documentos y el código (al 2026-11-05)
El MER y el diagrama de clases de `docs/requisitos` describen un modelo más completo que el implementado:
- No existen las tablas `RESENA` ni `NOTIFICACION`, y `puntos` no tiene `calificacionPromedio` ni `totalResenas`. Por eso HU-23 y RF-014 están pendientes.
- `entregas` usa `tipo`, `cantidad` y `unidad`. El MER pide `nombreArticulo`, `peso`, `estadoConservacion`, `fotoUrl` e `idCategoria`.
- Los correos se envían por SMTP (Gmail/nodemailer). Los documentos hablan de Resend.
- No hay un dashboard de impacto (HU-22).
- El `README.md` todavía describe el backend FastAPI.
- Pendiente del README: migraciones incrementales y optimización del módulo de historial e impacto.

## Convenciones
- Todo el código, los nombres de tablas y campos y los textos de la interfaz van en **español** (`usuario_id`, `fecha_creacion`, `motivo_rechazo`...).
- Los cambios de esquema se hacen editando `schema.prisma` y ejecutando `npx prisma migrate dev --name <descripcion>`.
