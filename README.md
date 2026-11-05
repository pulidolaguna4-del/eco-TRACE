# eco-TRACE 🌿

Plataforma web que centraliza y verifica puntos ecológicos (reciclaje, donación de ropa, reciclaje electrónico) en la ciudad.

## 🚀 Despliegue con Docker (Recomendado)

Con un solo comando puedes levantar la base de datos (PostgreSQL), el backend (Express + Prisma) y el frontend (React + Vite) listos para desarrollo:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Base de datos Postgres**: localhost:5432 (`eco_trace_db`)

Antes del primer arranque crea un archivo `.env` en la raíz con:

```env
POSTGRES_USER=eco_trace
POSTGRES_PASSWORD=eco_trace_password
POSTGRES_DB=eco_trace
SECRET_KEY=una_clave_larga_y_aleatoria
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=tu_contraseña_de_aplicacion
```

Al iniciar, el backend aplica automáticamente las migraciones de Prisma pendientes.

### 🔄 Recrear la base de datos desde cero (Aplicar cambios de esquema)

Para aplicar cambios en el modelo de datos limpiando la base de datos existente y sus volúmenes, ejecuta:

```bash
docker compose down -v
docker compose up --build
```

---

## 🛠️ Ejecución manual (Sin Docker)

Si prefieres levantar el backend y frontend manualmente de forma independiente:

### 1. Base de datos (PostgreSQL)
Asegúrate de tener un servidor PostgreSQL corriendo en `localhost:5432` con usuario `eco_trace`, contraseña `eco_trace_password` y base de datos `eco_trace`, o define la variable de entorno `DATABASE_URL`.

### 2. Backend (Express + Prisma)
Requiere Node.js 20 o superior. Crea `backend/.env` con `DATABASE_URL`, `SECRET_KEY`, `EMAIL_USER` y `EMAIL_PASSWORD`, por ejemplo:

```env
DATABASE_URL=postgresql://eco_trace:eco_trace_password@localhost:5432/eco_trace
```

```bash
cd backend
npm install
npm run db:migrate   # aplica las migraciones de Prisma
npm run dev          # http://localhost:8000 (se reinicia al guardar)
```

#### Estructura del backend

```
backend/
├── prisma/
│   ├── schema.prisma     # modelos de la base de datos
│   └── migrations/       # migraciones (0_init = esquema heredado de FastAPI)
├── scripts/migrate.js    # aplica migraciones (y hace baseline en bases existentes)
└── src/
    ├── server.js         # arranque del servidor
    ├── app.js            # aplicación Express (CORS, JSON, rutas, errores)
    ├── config/           # variables de entorno y cliente de Prisma
    ├── routes/           # definición de endpoints
    ├── controllers/      # leen la petición y dan forma a la respuesta
    ├── services/         # lógica de negocio y acceso a datos
    ├── middlewares/      # autenticación JWT, permisos de admin, validación, errores
    ├── validators/       # esquemas de validación (Zod)
    └── utils/            # JWT, hash de contraseñas, serializadores
```

#### Cambiar el esquema de la base de datos

```bash
cd backend
npx prisma migrate dev --name descripcion_del_cambio
```

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Funcionalidades implementadas

- **Autenticación**: registro (`/usuarios/registro`), login (`/usuarios/login`) con JWT y recuperación de contraseña vía código enviado por correo.
- **Usuarios**: listar, ver perfil propio (`/usuarios/me`), actualizar datos y eliminar cuentas.
- **Puntos ecológicos**: registrar puntos (con opción de URL de foto y fecha de creación), listar aprobados, listar puntos propios e historial.
- **Panel administrativo**: listar usuarios y cambiar permisos de administrador, listar puntos pendientes, aprobar y rechazar puntos (con motivo de rechazo).
- **Entregas/Donaciones**: registrar entregas en puntos aprobados y consultar historial de entregas.

### Convertir un usuario en administrador

Se puede hacer desde el panel de administración o directamente en la base de datos:

```bash
docker exec -it eco_trace_db psql -U eco_trace -d eco_trace -c "UPDATE usuarios SET es_admin = TRUE WHERE id = <ID_DEL_USUARIO>;"
```

> El usuario debe cerrar sesión y volver a iniciar sesión para que el cambio se refleje en su token JWT.

---

## 🔜 Pendiente

- Mantenimiento y optimización del módulo de historial e impacto
