# eco-TRACE · Especificación: Regalos (marketplace gratuito)

**Estado:** implementado, pendiente de validar con el instructor · **Rama:** `feat/marketplace-gratuito` · **Fecha:** 2026-11-13

> Alcance ampliado: según el proyecto, las funciones nuevas se validan con el instructor antes de darlas por cerradas.

---

## 1. Objetivo

Que los habitantes de Ciudad Bolívar **regalen** lo que ya no usan (5 kg de madera, una silla, ropa, cartón…) a alguien que sí lo puede aprovechar, **sin ningún costo**. Quien lo quiere lo pide, los dos coordinan la recogida por **chat** y el objeto se entrega en mano.

Así se reutilizan materiales antes de que terminen en la basura, y eso complementa los puntos ecológicos: **primero reutilizar, después reciclar**.

**Nombre en la interfaz (propuesto):** sección **"Regalos"** con el lema *"Dale una segunda vida a lo que ya no usas"*. En el código: `regalos`, `conversaciones`, `mensajes`.

---

## 2. Decisiones acordadas

| Tema | Decisión |
|---|---|
| Moderación | Las publicaciones **salen de inmediato**. Cualquiera puede reportarlas y el admin puede ocultarlas o eliminarlas. |
| Chat | **Tiempo real con WebSockets** (Socket.IO). Los mensajes se guardan en la base de datos. |
| A quién se le entrega | **Quien regala elige**: chatea con los interesados y **reserva** el objeto para quien de verdad va a pasar. |
| Ubicación | **Zona aproximada** (círculo de unos 300 m y barrio). La dirección exacta solo se comparte en el chat. |
| Costo | Siempre **gratis**. No hay precios, pagos ni trueques. |

---

## 3. Historias de usuario

Formato: Dado (contexto) / Cuando (evento) / Entonces (resultado), igual que `eco-TRACE_Historias_Usuario_Tier1.xlsx`.

### HU-24 · Publicar un regalo (5 pts)
**Como** usuario, **quiero** publicar algo que ya no uso, **para** que alguien más lo aproveche gratis.

| # | Criterio | Dado | Cuando | Entonces |
|---|---|---|---|---|
| 1 | Publicación exitosa | El usuario inició sesión | Completa título, categoría, cantidad, zona y al menos una foto, y presiona "Publicar" | El regalo queda **disponible** de inmediato en el listado y en el mapa |
| 2 | Fuera de la localidad | El usuario marca una zona | El punto queda fuera de Ciudad Bolívar | El sistema no deja publicar y explica que debe estar dentro de la localidad (Turf + GeoJSON) |
| 3 | Objeto prohibido | El usuario elige o describe algo prohibido | Intenta publicar | El sistema muestra la lista de objetos no permitidos y no publica (categoría "otro" + confirmación obligatoria) |
| 4 | Sin sesión | El usuario no inició sesión | Pulsa "Regalar algo" | El sistema le pide iniciar sesión |

### HU-25 · Explorar regalos (3 pts)
**Como** vecino, **quiero** ver qué están regalando cerca, **para** encontrar algo que me sirva.

| # | Criterio | Dado | Cuando | Entonces |
|---|---|---|---|---|
| 1 | Listado | Hay regalos disponibles | El usuario entra a "Regalos" | Ve tarjetas con foto, título, cantidad, categoría, barrio y antigüedad, más un mapa con zonas aproximadas |
| 2 | Filtros | Hay regalos de varias categorías | Elige una categoría o busca por texto | Solo ve los que coinciden |
| 3 | Sin resultados | No hay regalos que coincidan | Aplica un filtro | Ve un mensaje que lo invita a cambiar el filtro o a publicar algo |
| 4 | Privacidad | Cualquier usuario ve un regalo | Abre el detalle | Ve la zona aproximada y el barrio, **nunca** la dirección ni las coordenadas exactas |

### HU-26 · Pedir un regalo y chatear en tiempo real (8 pts)
**Como** interesado, **quiero** escribirle a quien regala, **para** acordar cuándo y dónde recogerlo.

| # | Criterio | Dado | Cuando | Entonces |
|---|---|---|---|---|
| 1 | Iniciar conversación | El regalo está disponible y no es mío | Pulso "Me interesa" | Se abre un chat entre los dos. Si ya existía, se abre el mismo, sin duplicarlo |
| 2 | Mensaje en vivo | Los dos tienen el chat abierto | Uno envía un mensaje | El otro lo ve al instante, sin recargar |
| 3 | Sin conexión | El destinatario no está conectado | Recibo un mensaje | Queda guardado; al entrar verá el contador de no leídos en la barra de navegación |
| 4 | Ajeno al chat | Un usuario no participa en la conversación | Intenta leerla o escribir en ella | El sistema lo rechaza (403) |
| 5 | Propio regalo | El regalo es mío | Abro el detalle | No veo "Me interesa"; veo la lista de interesados y sus chats |

### HU-27 · Reservar y entregar (3 pts)
**Como** quien regala, **quiero** reservar el objeto para una persona y marcarlo como entregado, **para** que los demás sepan que ya no está disponible.

| # | Criterio | Dado | Cuando | Entonces |
|---|---|---|---|---|
| 1 | Reservar | Tengo varios interesados | Elijo "Reservar para…" uno de ellos | El regalo pasa a **reservado**, sale del listado de disponibles y cada interesado recibe un aviso en su chat |
| 2 | No pasó | El regalo está reservado | La persona no vino y pulso "Liberar" | Vuelve a **disponible** |
| 3 | Entregado | El regalo está reservado | Pulso "Marcar como entregado" | Pasa a **entregado**, se cierra para nuevos interesados y, si la unidad es kg, suma a "kg reutilizados" en el dashboard de impacto |
| 4 | Cancelar | El regalo no está entregado | Pulso "Ya no lo regalo" | Pasa a **cancelado** y los chats quedan en solo lectura |
| 5 | Vencimiento | Pasaron 30 días sin entregarse | — | Pasa a **vencido**. Quien lo publicó puede renovarlo por 30 días más |

### HU-28 · Reportar y moderar (3 pts)
**Como** comunidad y administrador, **queremos** reportar publicaciones o mensajes indebidos, **para** mantener el espacio seguro.

| # | Criterio | Dado | Cuando | Entonces |
|---|---|---|---|---|
| 1 | Reportar | Veo una publicación o un mensaje indebido | Pulso "Reportar" y escribo el motivo | Queda un reporte pendiente para el admin |
| 2 | Moderar | Soy admin | Abro "Regalos" en el panel | Veo los reportes y puedo ocultar o eliminar el regalo, o descartar el reporte |
| 3 | Privacidad del chat | Soy admin | Reviso un reporte de mensaje | Veo **solo el mensaje reportado** y su contexto inmediato, no toda la conversación |

**Total: 22 puntos** (HU-24 a HU-28).

---

## 4. Reglas de negocio

1. Solo usuarios con sesión publican, piden o chatean. El listado y el detalle son públicos.
2. **Estados del regalo:** `disponible → reservado → entregado`. Además, `reservado → disponible` (liberar), `disponible | reservado → cancelado` y `disponible → vencido` (30 días).
3. Un usuario no puede pedir su propio regalo. Hay **una conversación por regalo e interesado**.
4. Cuando el regalo pasa a entregado, cancelado, vencido u oculto, sus chats quedan en **solo lectura**.
5. **Objetos no permitidos:** comida y bebidas abiertas, medicamentos, animales, armas, químicos o productos peligrosos, objetos robados y cualquier cosa ilegal.
6. **Límites:** hasta 3 fotos por regalo (se reutiliza la subida de fotos de las entregas), título de hasta 80 caracteres, descripción de hasta 500, mensajes de hasta 1000 y máximo 20 mensajes por minuto por usuario.
7. **Ubicación:** se guardan las coordenadas exactas, pero la API pública devuelve un centro **desplazado de forma estable** (hasta unos 300 m) y el barrio. Las coordenadas exactas solo las ve el dueño.
8. **Consejos de seguridad** visibles en el chat: verse en un lugar público y de día, no compartir datos bancarios (nunca hay pagos).
9. **Impacto:** los regalos entregados en kg suman a un contador **"kg reutilizados"**, separado de los "kg reciclados". Los entregados en unidades suman a "objetos reutilizados".

---

## 5. Modelo de datos (Prisma / PostgreSQL)

```
regalos
  id, usuario_id → usuarios
  titulo (80), descripcion (500, opcional)
  categoria   madera | papel_carton | plastico | vidrio | metal | ropa | electronicos | muebles | otro
  cantidad (decimal), unidad (kg | unidades)
  estado      disponible | reservado | entregado | cancelado | vencido
  oculto (bool, moderación), motivo_ocultamiento
  latitud, longitud            (exactas, nunca públicas)
  barrio (opcional)
  fotos  text[]                (rutas /uploads/regalos/…)
  reservado_para_id → usuarios (opcional)
  fecha_creacion, fecha_actualizacion, fecha_vencimiento, fecha_entrega

conversaciones
  id, regalo_id → regalos, interesado_id → usuarios
  fecha_creacion, fecha_ultimo_mensaje
  UNIQUE (regalo_id, interesado_id)

mensajes
  id, conversacion_id → conversaciones, remitente_id → usuarios
  texto (1000), tipo (usuario | sistema)   ← "Reservado para ti", "Entregado"…
  fecha, leido_en (opcional)

reportes_regalo
  id, regalo_id, mensaje_id (opcional), usuario_id
  motivo (500), estado (pendiente | revisado | descartado), observacion_admin
  fecha_creacion
```

Migración: `5_regalos`. Las fechas van en UTC, como en el resto del proyecto.

---

## 6. API

### REST
| Método y ruta | Auth | Descripción |
|---|---|---|
| `GET /regalos` | — | Disponibles. Filtros: `categoria`, `q`. Ubicación aproximada |
| `GET /regalos/:id` | opcional | Detalle. El dueño recibe además las coordenadas exactas y los interesados |
| `POST /regalos` | ✓ | Crear (multipart: datos y hasta 3 `fotos`) |
| `PUT /regalos/:id` | dueño | Editar título, descripción, cantidad y fotos |
| `PUT /regalos/:id/reservar` | dueño | `{ interesado_id }` |
| `PUT /regalos/:id/liberar` · `/entregar` · `/cancelar` · `/renovar` | dueño | Cambios de estado |
| `GET /regalos/mios` | ✓ | Mis publicaciones con su número de interesados |
| `POST /regalos/:id/conversacion` | ✓ | "Me interesa": crea o devuelve el chat |
| `GET /conversaciones` | ✓ | Mis chats (como dueño o interesado), con el último mensaje y los no leídos |
| `GET /conversaciones/:id/mensajes` | participante | Historial paginado |
| `POST /regalos/:id/reportes` | ✓ | Reportar una publicación o un mensaje (`mensaje_id` opcional) |
| `GET /admin/regalos/reportes` · `PUT …/:id/revisar` · `PUT /admin/regalos/:id/ocultar` · `DELETE /admin/regalos/:id` | admin | Moderación |

### WebSockets (Socket.IO en el mismo servidor, puerto 8000)
- **Conexión:** `io(API_URL, { auth: { token } })`. El servidor verifica el JWT; sin token válido, rechaza la conexión.
- **Salas:** `usuario:<id>` (avisos y no leídos) y `conversacion:<id>`. Solo se puede entrar si se participa en la conversación.
- **Eventos del cliente:** `conversacion:unirse`, `mensaje:enviar { conversacion_id, texto }` (con respuesta de confirmación), `mensajes:leidos`, `escribiendo`.
- **Eventos del servidor:** `mensaje:nuevo`, `mensajes:leidos`, `escribiendo`, `regalo:estado` (reservado, entregado…), `no_leidos { total }`.
- Todo mensaje **se guarda primero** en la base de datos y después se emite. Si la conexión se cae, el historial se recupera por REST.

---

## 7. Pantallas

| Ruta | Contenido |
|---|---|
| `/regalos` | Encabezado con "Regalar algo", filtros por categoría, buscador, tarjetas y mapa con zonas aproximadas |
| `/regalos/nuevo` | Formulario con fotos (hasta 3, comprimidas en el navegador), categoría, cantidad, zona en el mapa, barrio y lista de objetos no permitidos |
| `/regalos/:id` | Fotos, datos, zona, publicador y botón "Me interesa". Para el dueño: interesados, reservar, entregar y cancelar |
| `/mensajes` | Bandeja de chats a la izquierda y conversación a la derecha (en el celular, una vista a la vez), con el estado del regalo arriba |
| Barra de navegación | Enlace "Regalos". En el menú de usuario: "Mis regalos" y "Mensajes" con el contador de no leídos |
| Panel admin | Nueva sección "Regalos" en Moderación, con los reportes |
| Impacto | Nuevas tarjetas: "kg reutilizados" y "objetos regalados" |

Todo con el estilo del rediseño: etiqueta superior verde, títulos `font-black`, tarjetas `rounded-2xl` y modo oscuro.

---

## 8. Fuera de alcance (v1)

- Calificaciones entre usuarios y reputación.
- Envío a domicilio, trueques o cualquier tipo de pago.
- Notificaciones push y por correo (se pueden agregar después con la tabla `NOTIFICACION`).
- Bloquear usuarios (por ahora se reporta).
- Fotos dentro del chat.

---

## 9. Plan de implementación

1. **Base de datos y API REST:** migración `5_regalos`, servicios, validaciones (Zod) y subida de fotos en `uploads/regalos`.
2. **Publicar y explorar:** `/regalos`, `/regalos/nuevo`, `/regalos/:id` y "Mis regalos".
3. **Chat en tiempo real:** Socket.IO en el backend (autenticación JWT y salas), `socket.io-client`, `/mensajes` y el contador de no leídos.
4. **Estados e impacto:** reservar, liberar, entregar, cancelar, vencimiento a los 30 días y "kg reutilizados" en `/impacto`.
5. **Moderación:** reportes y sección "Regalos" en el panel de admin.
6. **Verificación:** flujo completo con dos cuentas (publicar, pedir, chatear, reservar, entregar), permisos, privacidad de la ubicación y modo oscuro y móvil.

---

## 10. Pendiente de confirmar

- Nombre de la sección ("Regalos" u otro).
- Lista final de categorías y de objetos no permitidos.
- Duración de la publicación (30 días).
- Si "kg reutilizados" se muestra separado o sumado a "kg reciclados" en el dashboard.

---

## 11. Avance de la implementación (2026-11-13)

> Para probarlo: `git switch feat/marketplace-gratuito && git pull`, luego `docker compose up -d --build`. Esto instala `socket.io` y `socket.io-client` y aplica la migración `5_regalos`.

**Estado:** backend y frontend completos (pasos 1 a 6 del plan). Falta la validación con el instructor y abrir el PR a `main`.

### ✅ Backend
| Archivo | Qué hace |
|---|---|
| `backend/prisma/schema.prisma` + `migrations/5_regalos` | Tablas `regalos`, `conversaciones`, `mensajes` y `reportes_regalo`, con borrado en cascada |
| `backend/src/services/regalos.service.js` | Publicar, listar, detalle, mis regalos, editar, estados (reservar, liberar, entregar, cancelar, renovar, vencer), conversaciones, mensajes, no leídos, reportes, moderación y resumen de impacto |
| `backend/src/utils/serializadoresRegalos.js` | Respuestas de la API y **zona aproximada** (HMAC con `SECRET_KEY`; las coordenadas exactas solo las ve el dueño o el admin) |
| `backend/src/tiempoReal.js` + `utils/emisor.js` | Socket.IO en el mismo puerto: JWT en el handshake, sala `usuario:<id>`, eventos `mensaje:enviar`, `mensajes:leidos`, `escribiendo`, `mensaje:nuevo`, `regalo:estado` y `no_leidos` |
| `backend/src/server.js` | Servidor HTTP compartido con Socket.IO y vencimiento de regalos cada hora |
| `backend/src/routes/regalos.routes.js`, `conversaciones.routes.js`, `admin.routes.js` | Endpoints de la sección 6, más `GET /conversaciones/no-leidos` y `POST /conversaciones/:id/mensajes` como alternativa REST |
| `backend/src/middlewares/subirFoto.js` | `subirFoto` (entregas, 1 foto) y `subirFotosRegalo` (hasta 3, en `uploads/regalos`) |
| `backend/src/services/impacto.service.js` | `GET /impacto` incluye `regalos: { kg_reutilizados, regalos_entregados, regalos_disponibles }` |

**Correcciones encontradas al probarlo (2026-11-13):**
- Los avisos automáticos ("A Beto le interesa", "Reservado para ti"…) se guardan a nombre de quien los causó. Antes contaban como no leídos para los dos y, como `leido_en` es uno solo, el primero que abría el chat se los marcaba como leídos al otro. Los avisos del administrador siguen sin remitente. Los avisos automáticos no se pueden reportar.
- Socket.IO registraba los manejadores después de un `await`: un mensaje enviado justo al conectarse se perdía.

### ✅ Frontend
| Archivo | Qué hace |
|---|---|
| `src/context/ChatContext.jsx` | Una conexión de Socket.IO para toda la app (con el JWT; se reconecta al iniciar o cerrar sesión), total de no leídos, `suscribir`/`useEventoChat`, enviar y marcar leídos con respaldo por REST |
| `src/utils/regalos.js` | Categorías, estados, objetos prohibidos, consejos de seguridad, límites y `api()` |
| `src/components/regalos/` | Tarjeta, insignias, fotos, `MapaZonas` (círculos de 300 m), `SelectorZona` (Turf) y modales (reportar, editar, confirmar) |
| `src/pages/Regalos.jsx` (`/regalos`) | Listado público con búsqueda sin tildes, filtro por categoría, vista de lista o mapa y estados vacíos |
| `src/pages/RegaloNuevo.jsx` (`/regalos/nuevo`) | Hasta 3 fotos comprimidas (sin EXIF), categoría, cantidad, zona dentro de Ciudad Bolívar, barrio y confirmación de las reglas |
| `src/pages/RegaloDetalle.jsx` (`/regalos/:id`) | Galería, zona, "Me interesa" y reporte. El dueño ve el punto exacto, los interesados y reserva, entrega, libera, cancela, renueva o edita. Se actualiza en vivo |
| `src/pages/Mensajes.jsx` (`/mensajes`) | Bandeja y chat en tiempo real: escribiendo, ✓✓ de leído, avisos del sistema, mensajes anteriores, reporte de mensajes, solo lectura al cerrarse y reconexión. En el celular, una vista a la vez |
| `src/pages/MisRegalos.jsx` (`/mis-regalos`) | Mis publicaciones con su estado, interesados y kg reutilizados |
| `Navbar`, `Perfil`, `Home` | Enlace "Regalos"; "Mis regalos" y "Mensajes" con el contador de no leídos |
| `src/components/admin/SeccionRegalos.jsx` | Moderación: reportes con el contexto limitado del mensaje, ocultar o mostrar, eliminar, revisar o descartar |
| `src/pages/Impacto.jsx` | Tarjetas de kg reutilizados, regalos entregados y disponibles (separadas de los kg reciclados) |

### ✅ Verificación (2026-11-13)
- **API** (80 comprobaciones con 3 usuarios y un admin): publicar con validaciones, privacidad de la zona, filtros, "Me interesa" sin duplicar, mensajes por REST y socket, 403 a quien no participa, token falso rechazado, estados y sus errores 409, vencimiento y renovación, impacto, reportes, moderación, borrado de fotos y límite de 20 mensajes por minuto.
- **Navegador** (Playwright, dos sesiones a la vez): el flujo completo publicar → explorar → "Me interesa" → chat en vivo (escribiendo y leídos) → reservar → entregar → chat cerrado → impacto; reporte de un mensaje y moderación del admin; celular en modo oscuro sin desplazamiento horizontal. Sin errores en la consola.

### ⏭️ Pendiente
1. Validar con el instructor los puntos de la sección 10.
2. PR a `main`.
