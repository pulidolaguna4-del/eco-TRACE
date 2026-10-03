from typing import Optional, List
from datetime import datetime

from sqlmodel import Field, SQLModel, Relationship


# =========================================================
# USUARIO
# =========================================================

class Usuario(SQLModel, table=True):

    __tablename__ = "usuarios"

    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    nombre: str

    correo: str = Field(
        index=True,
        unique=True
    )

    password: str

    # Indica si el usuario es administrador
    es_admin: bool = Field(
        default=False
    )

    puntos: List["Punto"] = Relationship(
        back_populates="usuario"
    )

    entregas: List["Entrega"] = Relationship(
        back_populates="usuario"
    )

    codigos_recuperacion: List["CodigoRecuperacion"] = Relationship(
        back_populates="usuario"
    )


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
# ACTUALIZAR USUARIO
# =========================================================

class UsuarioActualizar(SQLModel):

    nombre: str
    correo: str


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
# CATEGORÍA Y TABLA INTERMEDIA PUNTO-CATEGORÍA
# =========================================================

class PuntoCategoria(SQLModel, table=True):

    __tablename__ = "punto_categoria"

    punto_id: int = Field(
        foreign_key="puntos.id",
        primary_key=True
    )

    categoria_id: int = Field(
        foreign_key="categorias.id",
        primary_key=True
    )


class Categoria(SQLModel, table=True):

    __tablename__ = "categorias"

    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    nombre: str = Field(
        unique=True
    )

    puntos: List["Punto"] = Relationship(
        back_populates="categorias",
        link_model=PuntoCategoria
    )


# =========================================================
# PUNTO ECOLÓGICO
# =========================================================

class Punto(SQLModel, table=True):

    __tablename__ = "puntos"

    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    nombre: str

    descripcion: str

    direccion: str

    localidad: str

    latitud: float

    longitud: float

    estado: str = Field(
        default="pendiente"
    )

    fecha_creacion: datetime = Field(
        default_factory=datetime.now
    )

    foto_url: Optional[str] = Field(
        default=None
    )

    motivo_rechazo: Optional[str] = Field(
        default=None
    )

    usuario_id: int = Field(
        foreign_key="usuarios.id"
    )

    usuario: Optional[Usuario] = Relationship(
        back_populates="puntos"
    )

    entregas: List["Entrega"] = Relationship(
        back_populates="punto"
    )

    categorias: List[Categoria] = Relationship(
        back_populates="puntos",
        link_model=PuntoCategoria
    )


# =========================================================
# REGISTRO DE PUNTO
# =========================================================

class PuntoRegistro(SQLModel):

    nombre: str

    descripcion: str

    direccion: str

    localidad: str

    categorias: List[str]

    latitud: float

    longitud: float

    foto_url: Optional[str] = None


# =========================================================
# RESPUESTA DE PUNTO
# =========================================================

class PuntoRespuesta(SQLModel):

    id: int

    nombre: str

    descripcion: str

    direccion: str

    localidad: str

    categorias: List[str]

    latitud: float

    longitud: float

    estado: str

    fecha_creacion: datetime

    foto_url: Optional[str] = None

    motivo_rechazo: Optional[str] = None

    usuario_id: int


# =========================================================
# RECHAZO DE PUNTO
# =========================================================

class PuntoRechazo(SQLModel):

    motivo_rechazo: Optional[str] = None


# =========================================================
# ENTREGA / DONACIÓN / RECICLAJE
# =========================================================

class Entrega(SQLModel, table=True):

    __tablename__ = "entregas"

    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    # Usuario que realizó la entrega
    usuario_id: int = Field(
        foreign_key="usuarios.id"
    )

    # Punto ecológico donde se realizó la entrega
    punto_id: int = Field(
        foreign_key="puntos.id"
    )

    # Tipo de entrega:
    # ropa, reciclaje, reciclaje electrónico, etc.
    tipo: str

    # Cantidad entregada
    cantidad: float

    # Unidad de medida:
    # kg, unidades, prendas, etc.
    unidad: str

    # Fecha y hora en que se registró
    fecha: datetime = Field(
        default_factory=datetime.now
    )

        # Estado de la entrega
    # registrada, confirmada, cancelada
    estado: str = Field(
        default="registrada"
    )

    # Observación opcional de la entrega
    observacion: Optional[str] = None

    usuario: Optional[Usuario] = Relationship(
        back_populates="entregas"
    )

    punto: Optional[Punto] = Relationship(
        back_populates="entregas"
    )


# =========================================================
# REGISTRO DE ENTREGA
# =========================================================

class EntregaRegistro(SQLModel):
    
    punto_id: int
    
    tipo: str
    
    cantidad: float
    
    unidad: str
    
    observacion: Optional[str] = None
    
    


# =========================================================
# RESPUESTA DE ENTREGA
# =========================================================

class EntregaRespuesta(SQLModel):
    
    id: int
    
    usuario_id: int
    
    punto_id: int
    
    tipo: str
    
    cantidad: float
    
    unidad: str
    
    fecha: datetime
    
    estado: str
    
    observacion: Optional[str] = None
    
# =========================================================
# RESPUESTA DE ENTREGA PARA ADMINISTRADOR
# =========================================================

class EntregaAdminRespuesta(SQLModel):

    id: int

    usuario_id: int
    usuario_nombre: str
    usuario_correo: str

    punto_id: int
    punto_nombre: str
    punto_direccion: str

    tipo: str
    cantidad: float
    unidad: str
    fecha: datetime
    estado: str

    observacion: Optional[str] = None


# =========================================================
# CÓDIGO DE RECUPERACIÓN DE CONTRASEÑA
# =========================================================

class CodigoRecuperacion(SQLModel, table=True):

    __tablename__ = "codigos_recuperacion"

    id: Optional[int] = Field(
        default=None,
        primary_key=True
    )

    usuario_id: int = Field(
        foreign_key="usuarios.id",
        index=True
    )

    codigo: str

    fecha_expiracion: str

    utilizado: bool = Field(
        default=False
    )

    usuario: Optional[Usuario] = Relationship(
        back_populates="codigos_recuperacion"
    )


# =========================================================
# SOLICITAR RECUPERACIÓN
# =========================================================

class SolicitarRecuperacion(SQLModel):

    correo: str


# =========================================================
# VERIFICAR CÓDIGO
# =========================================================

class VerificarCodigo(SQLModel):

    correo: str

    codigo: str


# =========================================================
# CAMBIAR CONTRASEÑA
# =========================================================

class NuevaContrasena(SQLModel):

    correo: str

    codigo: str

    nueva_password: str


# =========================================================
# REPORTES DE PUNTOS ECOLÓGICOS
# =========================================================

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Reporte(SQLModel, table=True):
    __tablename__ = "reportes"

    id: Optional[int] = Field(default=None, primary_key=True)

    punto_id: int = Field(
        foreign_key="puntos.id",
        index=True
    )

    usuario_id: int = Field(
        foreign_key="usuarios.id",
        index=True
    )

    motivo: str = Field(
        min_length=5,
        max_length=500
    )

    estado: str = Field(
        default="pendiente",
        index=True
    )

    fecha_creacion: datetime = Field(
        default_factory=datetime.now
    )

    observacion_admin: Optional[str] = Field(
        default=None,
        max_length=500
    )


class ReporteRegistro(SQLModel):
    punto_id: int
    motivo: str = Field(
        min_length=5,
        max_length=500
    )


class ReporteRevision(SQLModel):
    estado: str
    observacion_admin: Optional[str] = Field(
        default=None,
        max_length=500
    )