## 🔑 Funcionalidades implementadas

- **Autenticación**: registro (`/usuarios/registro`) y login (`/usuarios/login`) con JWT.
- **Usuarios**: listar, ver perfil propio (`/usuarios/me`), eliminar.
- **Puntos ecológicos**: registrar, listar aprobados, listar propios.
- **Panel administrativo**: listar puntos pendientes, aprobar/rechazar (requiere `es_admin = true` en la base de datos).

### Convertir un usuario en administrador

No hay endpoint para esto todavía; se hace manualmente en la base de datos:

```bash
docker exec -it eco_trace_db psql -U eco_trace -d eco_trace -c "UPDATE usuarios SET es_admin = TRUE WHERE id = <ID_DEL_USUARIO>;"
```

> El usuario debe cerrar sesión y volver a iniciar sesión para que el cambio se refleje (el estado `es_admin` queda fijo dentro del token JWT desde el momento del login).

## 🔜 Pendiente

- Migraciones con Alembic
- `requirements.txt` / `.env.example` versionados en el repo (ver instrucciones arriba)
- Validación de campos y mensajes de error específicos en formularios del frontend
- Módulo de historial e impacto