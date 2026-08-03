# eco-TRACE
# 🌱 eco-TRACE

> Plataforma web para el registro, consulta y seguimiento de puntos ecológicos (reciclaje, electrónicos y donación) mediante geolocalización, con flujo de propuesta/aprobación comunitaria y panel administrativo.

---

## 📋 Tabla de Contenidos

- [🌱 eco-TRACE](#-eco-trace)
  - [📋 Tabla de Contenidos](#-tabla-de-contenidos)
  - [🛠️ Stack Tecnológico](#️-stack-tecnológico)
  - [✅ Prerrequisitos](#-prerrequisitos)
  - [🚀 Instalación y Setup](#-instalación-y-setup)
    - [1. Clonar el repositorio](#1-clonar-el-repositorio)
    - [2. Levantar la base de datos](#2-levantar-la-base-de-datos)
    - [3. Configurar el Backend](#3-configurar-el-backend)
    - [4. Configurar el Frontend](#4-configurar-el-frontend)
  - [▶️ Ejecución](#️-ejecución)
  - [🧪 Testing](#-testing)
  - [📁 Estructura del Proyecto](#-estructura-del-proyecto)
  - [🧩 Módulos y Funcionalidades](#-módulos-y-funcionalidades)
  - [🗺️ Roadmap / Sprints](#️-roadmap--sprints)
  - [📏 Convenciones](#-convenciones)
  - [🤝 Contribución](#-contribución)
  - [📄 Licencia](#-licencia)

---

## 🛠️ Stack Tecnológico

| Capa              | Tecnologías                                          |
| ----------------- | ----------------------------------------------------- |
| **Backend**       | Python 3.12+, FastAPI, SQLAlchemy 2.0, Alembic, JWT   |
| **Frontend**      | React 18+, Vite                                       |
| **Base de datos** | PostgreSQL 17+ (Docker Compose)                       |
| **Mapas**         | API de geolocalización (a definir, ej. Leaflet)       |
| **Testing**       | pytest + httpx (BE), Vitest + Testing Library (FE)    |
| **Linting**       | ruff (Python), ESLint + Prettier (TypeScript/JS)      |

---

## ✅ Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta        | Versión mínima | Verificar con            |
| ------------------ | -------------- | ------------------------ |
| **Python**         | 3.12+          | `python3 --version`      |
| **Node.js**        | 20 LTS+        | `node --version`         |
| **pnpm**           | 9+             | `pnpm --version`         |
| **Docker**         | 24+            | `docker --version`       |
| **Docker Compose** | 2.20+          | `docker compose version` |
| **Git**            | 2.40+          | `git --version`          |

> ⚠️ **Importante**: usar **pnpm** como gestor de paquetes de Node.js.

### Instalar pnpm (si no lo tienes)

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

---

## 🚀 Instalación y Setup

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd eco-trace
```

### 2. Levantar la base de datos

```bash
# Inicia PostgreSQL 17 en contenedor Docker
docker compose up -d

# Verificar que está corriendo
docker compose ps
# Deberías ver ecotrace_db con estado "healthy"
```

### 3. Configurar el Backend

```bash
cd backend

# Crear entorno virtual de Python
python3 -m venv .venv
source .venv/bin/activate          # Linux/macOS y Windows (Git Bash)

# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones de base de datos
alembic upgrade head
```

### 4. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias con pnpm
pnpm install

# Copiar y configurar variables de entorno
cp .env.example .env
```

---

## ▶️ Ejecución

```bash
# Terminal 1 — Base de datos (si no está corriendo)
docker compose up -d

# Terminal 2 — Backend (FastAPI)
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload
# → API disponible en http://localhost:8000
# → Swagger UI en http://localhost:8000/docs

# Terminal 3 — Frontend (React + Vite)
cd frontend && pnpm dev
# → App disponible en http://localhost:5173
```

---

## 🧪 Testing

### Backend

```bash
cd backend && source .venv/bin/activate

pytest -v
pytest --cov=app --cov-report=term-missing
```

### Frontend

```bash
cd frontend

pnpm test
pnpm test:coverage
```

### Linting

```bash
# Backend
cd backend && ruff check app/ && ruff format app/

# Frontend
cd frontend && pnpm lint && pnpm format
```

---

## 📁 Estructura del Proyecto

```
eco-trace/
├── .gitignore
├── docker-compose.yml              # PostgreSQL para desarrollo
├── README.md                       # ← Este archivo
├── docs/
│   └── eco-TRACE_Backlog_Priorizado_Final.xlsx
├── backend/                        # Backend — FastAPI + Python
│   ├── app/
│   │   ├── main.py                 # Punto de entrada FastAPI
│   │   ├── config.py                # Configuración (Pydantic Settings)
│   │   ├── database.py              # Conexión a PostgreSQL
│   │   ├── models/                  # Modelos ORM (User, Point, Proposal, Rating…)
│   │   ├── schemas/                 # Schemas Pydantic (request/response)
│   │   ├── routers/                 # Endpoints (auth, points, proposals, admin, history)
│   │   ├── services/                # Lógica de negocio
│   │   ├── utils/                   # Utilidades (security, email, geolocalización)
│   │   └── tests/                   # Tests con pytest
│   ├── alembic/                     # Migraciones de BD
│   ├── requirements.txt
│   └── .env.example
└── frontend/                        # Frontend — React + Vite
    ├── src/
    │   ├── api/                     # Clientes HTTP
    │   ├── components/              # Componentes reutilizables (mapa, formularios…)
    │   ├── pages/                   # Páginas/vistas (Login, Mapa, Propuestas, Admin, Historial)
    │   ├── hooks/                   # Custom hooks
    │   ├── context/                 # Context providers
    │   └── App.jsx
    ├── package.json                 # Dependencias (pnpm)
    └── vite.config.js
```

---

## 🧩 Módulos y Funcionalidades

El alcance funcional se organiza en 6 épicas, derivadas del backlog priorizado (23 historias de usuario, 70 puntos de historia totales):

**Autenticación y perfil** — Registro, inicio y cierre de sesión, recuperación de contraseña, gestión de perfil.

**Mapa y consulta** — Visualizar mapa, marcadores geográficos, puntos ecológicos/electrónicos/donación, consultar información detallada, filtrar puntos.

**Propuesta y aprobación** — Proponer nuevos puntos, registrar información de propuestas, enviar a revisión, geolocalización, reportar información incorrecta.

**Panel administrativo** — Ver solicitudes pendientes, aprobar puntos.

**Historial e impacto** — Notificación por correo al aprobar/rechazar, historial de entregas, dashboard de estadísticas de impacto.

**Calidad del dato** — Calificar y reseñar un punto ecológico.

---

## 🗺️ Roadmap / Sprints

Planificación basada en capacidad estimada de 20 h/semana por el equipo, velocidad de 25 pts/iteración y sprints de 4 semanas.

| Sprint   | Épicas incluidas                                                    | Puntos planeados | Duración      |
| -------- | -------------------------------------------------------------------- | ----------------- | -------------- |
| Sprint 1 | Autenticación y perfil, Mapa y consulta                              | 23                | Semanas 1-4    |
| Sprint 2 | Mapa y consulta, Propuesta y aprobación                              | 21                | Semanas 5-8    |
| Sprint 3 | Propuesta y aprobación, Panel administrativo, Historial e impacto    | 23                | Semanas 9-12   |
| Sprint 4 | Calidad del dato                                                      | 3                  | Semanas 13-16  |

> Con 70 puntos totales el proyecto requiere ~3 sprints (~12 semanas), dejando margen dentro del cronograma para tareas adicionales (tests, CI/CD, accesibilidad) antes de abordar funcionalidades de menor prioridad.

---

## 📏 Convenciones

| Aspecto              | Regla                                             |
| --------------------- | -------------------------------------------------- |
| Nomenclatura técnica  | Inglés (variables, funciones, clases, endpoints)   |
| Comentarios/docs      | Español                                            |
| Commits               | Conventional Commits (ej. `feat: HU-02 login`)     |
| Python                | PEP 8 + type hints + ruff                          |
| Frontend              | ESLint + Prettier                                  |
| Gestor de paquetes    | `venv` (Python), `pnpm` (Node.js — nunca npm/yarn) |

---

## 🤝 Contribución

1. Crear una rama a partir de `develop`: `git checkout -b feature/HU-XX-nombre-corto`
2. Referenciar la historia de usuario del backlog en el commit (ej. `HU-02`)
3. Abrir un Pull Request describiendo los cambios y vincular la HU correspondiente
4. Solicitar revisión antes de hacer merge

---

## 📄 Licencia

Basado en el backlog priorizado del proyecto (`eco-TRACE_Backlog_Priorizado_Final.xlsx`), 23 historias de usuario y 70 puntos de historia distribuidos en 4 sprints.