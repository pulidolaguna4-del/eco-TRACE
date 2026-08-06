from typing import Optional

from sqlmodel import Field, SQLModel


# =========================================================
# USUARIO
# =========================================================

class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    correo: str = Field(index=True, unique=True)
    password: str

    # Indica si el usuario es administrador
    es_admin: bool = Field(default=False)


# =========================================================
# REGISTRO DE USUARIO
# =========================================================

class UsuarioRegistro(SQLModel):
    nombre: str
    correo: str
    password: str


# =========================================================
# RESPUESTA DE USUARIO
# =========================================================

class UsuarioRespuesta(SQLModel):
    id: int
    nombre: str
    correo: str
    es_admin: bool


# =========================================================
# LOGIN
# =========================================================

class UsuarioLogin(SQLModel):
    correo: str
    password: str


# =========================================================
# RESPUESTA DEL TOKEN
# =========================================================

class TokenRespuesta(SQLModel):
    access_token: str
    token_type: str
    usuario: UsuarioRespuesta


# =========================================================
# PUNTO ECOLÓGICO
# =========================================================

class Punto(SQLModel, table=True):
    __tablename__ = "puntos"

    id: Optional[int] = Field(default=None, primary_key=True)

    nombre: str
    descripcion: str
    direccion: str
    localidad: str
    tipo: str

    latitud: float
    longitud: float

    estado: str = Field(default="pendiente")

    usuario_id: int = Field(foreign_key="usuarios.id")


# =========================================================
# REGISTRO DE PUNTO
# =========================================================

class PuntoRegistro(SQLModel):
    nombre: str
    descripcion: str
    direccion: str
    localidad: str
    tipo: str
    latitud: float
    longitud: float


# =========================================================
# RESPUESTA DE PUNTO
# =========================================================

class PuntoRespuesta(SQLModel):
    id: int
    nombre: str
    descripcion: str
    direccion: str
    localidad: str
    tipo: str
    latitud: float
    longitud: float
    estado: str
    usuario_id: int