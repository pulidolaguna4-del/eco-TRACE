from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlmodel import SQLModel, Session, select
from pwdlib import PasswordHash
import jwt
import os
from dotenv import load_dotenv

from app.database import engine
from app.models import (
    Usuario,
    UsuarioRegistro,
    UsuarioRespuesta,
    UsuarioLogin,
    TokenRespuesta,
    Punto,
    PuntoRegistro,
    PuntoRespuesta
)


# =========================================================
# CONFIGURACIÓN
# =========================================================

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("No se encontró SECRET_KEY en el archivo .env")

ALGORITHM = "HS256"


app = FastAPI(
    title="Eco-TRACE API"
)


password_hash = PasswordHash.recommended()

security = HTTPBearer()


# =========================================================
# CREAR TABLAS Y ACTUALIZAR BASE DE DATOS
# =========================================================

@app.on_event("startup")
def crear_tablas():

    SQLModel.metadata.create_all(engine)

    with engine.begin() as conexion:

        # Actualizar secuencia de usuarios
        conexion.execute(
            text("""
                SELECT setval(
                    pg_get_serial_sequence('usuarios', 'id'),
                    COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1,
                    false
                )
            """)
        )

        # Agregar es_admin si todavía no existe
        conexion.execute(
            text("""
                ALTER TABLE usuarios
                ADD COLUMN IF NOT EXISTS es_admin BOOLEAN
                NOT NULL DEFAULT FALSE
            """)
        )


# =========================================================
# OBTENER USUARIO ACTUAL
# =========================================================

def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(security)
):

    token = credenciales.credentials

    try:

        datos = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        usuario_id = datos.get("sub")

        if not usuario_id:

            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )

    with Session(engine) as session:

        usuario = session.get(
            Usuario,
            int(usuario_id)
        )

        if not usuario:

            raise HTTPException(
                status_code=401,
                detail="Usuario no encontrado"
            )

        return usuario


# =========================================================
# COMPROBAR ADMINISTRADOR
# =========================================================

def obtener_admin_actual(
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):

    if not usuario_actual.es_admin:

        raise HTTPException(
            status_code=403,
            detail="No tienes permisos de administrador"
        )

    return usuario_actual


# =========================================================
# INICIO
# =========================================================

@app.get("/")
def inicio():

    return {
        "mensaje": "API de Eco-TRACE funcionando"
    }


# =========================================================
# COMPROBAR BASE DE DATOS
# =========================================================

@app.get("/db")
def comprobar_base_datos():

    with engine.connect() as conexion:

        resultado = conexion.execute(
            text("SELECT 1")
        )

        valor = resultado.scalar()

    return {
        "mensaje": "Conexión con PostgreSQL exitosa",
        "resultado": valor
    }


# =========================================================
# REGISTRAR USUARIO
# =========================================================

@app.post(
    "/usuarios/registro",
    response_model=UsuarioRespuesta
)
def registrar_usuario(
    usuario: UsuarioRegistro
):

    with Session(engine) as session:

        usuario_existente = session.exec(
            select(Usuario).where(
                Usuario.correo == usuario.correo
            )
        ).first()

        if usuario_existente:

            raise HTTPException(
                status_code=400,
                detail="El correo ya está registrado"
            )

        contraseña_hasheada = password_hash.hash(
            usuario.password
        )

        nuevo_usuario = Usuario(
            nombre=usuario.nombre,
            correo=usuario.correo,
            password=contraseña_hasheada,
            es_admin=False
        )

        session.add(nuevo_usuario)
        session.commit()
        session.refresh(nuevo_usuario)

        return nuevo_usuario


# =========================================================
# LOGIN
# =========================================================

@app.post(
    "/usuarios/login",
    response_model=TokenRespuesta
)
def iniciar_sesion(
    datos: UsuarioLogin
):

    with Session(engine) as session:

        usuario = session.exec(
            select(Usuario).where(
                Usuario.correo == datos.correo
            )
        ).first()

        if not usuario:

            raise HTTPException(
                status_code=401,
                detail="Correo o contraseña incorrectos"
            )

        contraseña_correcta = password_hash.verify(
            datos.password,
            usuario.password
        )

        if not contraseña_correcta:

            raise HTTPException(
                status_code=401,
                detail="Correo o contraseña incorrectos"
            )

        datos_token = {
            "sub": str(usuario.id),
            "correo": usuario.correo
        }

        token = jwt.encode(
            datos_token,
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "usuario": usuario
        }


# =========================================================
# LISTAR USUARIOS
# =========================================================

@app.get(
    "/usuarios",
    response_model=list[UsuarioRespuesta]
)
def listar_usuarios(
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):

    with Session(engine) as session:

        usuarios = session.exec(
            select(Usuario)
        ).all()

        return usuarios


# =========================================================
# OBTENER MI USUARIO
# =========================================================

@app.get(
    "/usuarios/me",
    response_model=UsuarioRespuesta
)
def obtener_mi_usuario(
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):

    return usuario_actual


# =========================================================
# ELIMINAR USUARIO
# =========================================================

@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(
    usuario_id: int,
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):

    with Session(engine) as session:

        usuario = session.get(
            Usuario,
            usuario_id
        )

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        session.delete(usuario)
        session.commit()

        return {
            "mensaje": "Usuario eliminado correctamente"
        }


# =========================================================
# REGISTRAR PUNTO ECOLÓGICO
# =========================================================

@app.post(
    "/puntos",
    response_model=PuntoRespuesta
)
def registrar_punto(
    datos: PuntoRegistro,
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):

    with Session(engine) as session:

        nuevo_punto = Punto(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            direccion=datos.direccion,
            localidad=datos.localidad,
            tipo=datos.tipo,
            latitud=datos.latitud,
            longitud=datos.longitud,
            estado="pendiente",
            usuario_id=usuario_actual.id
        )

        session.add(nuevo_punto)
        session.commit()
        session.refresh(nuevo_punto)

        return nuevo_punto


# =========================================================
# LISTAR PUNTOS APROBADOS
# =========================================================

@app.get(
    "/puntos",
    response_model=list[PuntoRespuesta]
)
def listar_puntos():

    with Session(engine) as session:

        puntos = session.exec(
            select(Punto).where(
                Punto.estado == "aprobado"
            )
        ).all()

        return puntos


# =========================================================
# LISTAR MIS PUNTOS
# =========================================================

@app.get(
    "/puntos/mis-puntos",
    response_model=list[PuntoRespuesta]
)
def listar_mis_puntos(
    usuario_actual: Usuario = Depends(obtener_usuario_actual)
):

    with Session(engine) as session:

        puntos = session.exec(
            select(Punto).where(
                Punto.usuario_id == usuario_actual.id
            )
        ).all()

        return puntos


# =========================================================
# ADMIN - LISTAR PUNTOS PENDIENTES
# =========================================================

@app.get(
    "/admin/puntos/pendientes",
    response_model=list[PuntoRespuesta]
)
def listar_puntos_pendientes(
    administrador: Usuario = Depends(obtener_admin_actual)
):

    with Session(engine) as session:

        puntos = session.exec(
            select(Punto).where(
                Punto.estado == "pendiente"
            )
        ).all()

        return puntos


# =========================================================
# ADMIN - APROBAR PUNTO
# =========================================================

@app.put(
    "/admin/puntos/{punto_id}/aprobar",
    response_model=PuntoRespuesta
)
def aprobar_punto(
    punto_id: int,
    administrador: Usuario = Depends(obtener_admin_actual)
):

    with Session(engine) as session:

        punto = session.get(
            Punto,
            punto_id
        )

        if not punto:

            raise HTTPException(
                status_code=404,
                detail="Punto no encontrado"
            )

        punto.estado = "aprobado"

        session.add(punto)
        session.commit()
        session.refresh(punto)

        return punto


# =========================================================
# ADMIN - RECHAZAR PUNTO
# =========================================================

@app.put(
    "/admin/puntos/{punto_id}/rechazar",
    response_model=PuntoRespuesta
)
def rechazar_punto(
    punto_id: int,
    administrador: Usuario = Depends(obtener_admin_actual)
):

    with Session(engine) as session:

        punto = session.get(
            Punto,
            punto_id
        )

        if not punto:

            raise HTTPException(
                status_code=404,
                detail="Punto no encontrado"
            )

        punto.estado = "rechazado"

        session.add(punto)
        session.commit()
        session.refresh(punto)

# =========================================================
# CONVERTIR USUARIO EN ADMINISTRADOR
# =========================================================

@app.put("/hacer-admin/{usuario_id}")
def hacer_admin(usuario_id: int):

    with Session(engine) as session:

        usuario = session.get(
            Usuario,
            usuario_id
        )

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        usuario.es_admin = True

        session.add(usuario)
        session.commit()
        session.refresh(usuario)

        return {
            "mensaje": "Usuario convertido en administrador",
            "usuario": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "correo": usuario.correo,
                "es_admin": usuario.es_admin
            }
        }

        return punto



    