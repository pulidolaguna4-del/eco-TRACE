# eco-TRACE 🌿

Plataforma web que centraliza y verifica puntos ecológicos (reciclaje, donación de ropa, reciclaje electrónico) en la ciudad.

## 🚀 Despliegue con Docker (Recomendado)

Con un solo comando puedes levantar la base de datos (PostgreSQL), el backend (FastAPI) y el frontend (React + Vite) listos para desarrollo:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Documentación Swagger API**: http://localhost:8000/docs
- **Base de datos Postgres**: localhost:5432 (`eco_trace_db`)

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

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
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

- Migraciones incrementales con Alembic
- Mantenimiento y optimización del módulo de historial e impacto
