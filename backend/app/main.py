from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import SQLModel, Session, select
from pwdlib import PasswordHash

import jwt
import os
import random
import smtplib

from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from dotenv import load_dotenv

from app.database import engine

from app.models import (
    Usuario,
    UsuarioRegistro,
    UsuarioRespuesta,
    UsuarioActualizar,
    UsuarioLogin,
    TokenRespuesta,
    Punto,
    PuntoRegistro,
    PuntoRespuesta,
    PuntoRechazo,
    Entrega,
    EntregaRegistro,
    EntregaRespuesta,
    CodigoRecuperacion,
    SolicitarRecuperacion,
    VerificarCodigo,
    NuevaContrasena
)


# =========================================================
# CONFIGURACIÓN
# =========================================================

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError(
        "No se encontró SECRET_KEY en el archivo .env"
    )

EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "smtp.gmail.com"
)

EMAIL_PORT = int(
    os.getenv(
        "EMAIL_PORT",
        "587"
    )
)

EMAIL_USER = os.getenv("EMAIL_USER")

EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

if not EMAIL_USER or not EMAIL_PASSWORD:
    raise ValueError(
        "No se configuró EMAIL_USER o EMAIL_PASSWORD en el archivo .env"
    )

ALGORITHM = "HS256"


app = FastAPI(
    title="Eco-TRACE API"
)


# =========================================================
# CORS - PERMITIR FRONTEND REACT
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",
        "http://127.0.0.1"
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
# FUNCIÓN PARA ENVIAR CORREOS
# =========================================================

def enviar_correo_recuperacion(
    correo_destino: str,
    codigo: str
):

    mensaje = EmailMessage()

    mensaje["Subject"] = "Código de recuperación - Eco-TRACE"
    mensaje["From"] = EMAIL_USER
    mensaje["To"] = correo_destino

    mensaje.set_content(
        f"""
Hola,

Recibimos una solicitud para recuperar la contraseña de tu cuenta de Eco-TRACE.

Tu código de recuperación es:

{codigo}

Este código será válido durante 24 horas.

Si tú no solicitaste recuperar tu contraseña, puedes ignorar este correo.

Saludos,

Equipo Eco-TRACE
"""
    )

    try:

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT
        ) as servidor:

            servidor.starttls()

            servidor.login(
                EMAIL_USER,
                EMAIL_PASSWORD
            )

            servidor.send_message(
                mensaje
            )

    except Exception as error:

        print(
            "ERROR AL ENVIAR CORREO:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="No se pudo enviar el correo de recuperación"
        )



# =========================================================
# FUNCIÓN PARA NOTIFICAR ESTADO DE UN PUNTO
# =========================================================

def enviar_notificacion_punto(
    correo_destino: str,
    nombre_usuario: str,
    nombre_punto: str,
    estado: str,
    motivo_rechazo: str = None
):

    print("========================================")
    print("📧 INTENTANDO ENVIAR NOTIFICACIÓN")
    print("📧 DESTINATARIO:", correo_destino)
    print("👤 USUARIO:", nombre_usuario)
    print("📍 PUNTO:", nombre_punto)
    print("📌 ESTADO:", estado)
    if motivo_rechazo:
        print("📝 MOTIVO RECHAZO:", motivo_rechazo)
    print("========================================")

    mensaje = EmailMessage()

    if estado == "aprobado":

        mensaje["Subject"] = "¡Tu punto fue aprobado! - Eco-TRACE"

        contenido = f"""
Hola {nombre_usuario},

¡Tenemos buenas noticias!

Tu punto ecológico:

"{nombre_punto}"

ha sido APROBADO por un administrador de Eco-TRACE.

Ya puedes encontrarlo disponible en el mapa de Eco-TRACE.

Gracias por contribuir al cuidado del medio ambiente.

Saludos,

Equipo Eco-TRACE
"""

    else:

        mensaje["Subject"] = "Actualización sobre tu punto - Eco-TRACE"

        motivo_texto = f"\nMotivo de rechazo: {motivo_rechazo}\n" if motivo_rechazo else ""

        contenido = f"""
Hola {nombre_usuario},

Te informamos que tu punto ecológico:

"{nombre_punto}"

ha sido RECHAZADO por un administrador de Eco-TRACE.{motivo_texto}

Puedes revisar la información registrada y realizar una nueva propuesta si lo consideras necesario.

Gracias por contribuir a Eco-TRACE.

Saludos,

Equipo Eco-TRACE
"""

    mensaje["From"] = EMAIL_USER
    mensaje["To"] = correo_destino

    mensaje.set_content(contenido)

    try:

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT
        ) as servidor:

            servidor.starttls()

            servidor.login(
                EMAIL_USER,
                EMAIL_PASSWORD
            )

            servidor.send_message(
                mensaje
            )

        print(
            f"Correo de notificación enviado a {correo_destino}"
        )

    except Exception as error:

        # El punto ya fue aprobado/rechazado.
        # Un error de correo no debe deshacer la operación.
        print(
            "ERROR AL ENVIAR NOTIFICACIÓN:",
            error
        )

# =========================================================
# OBTENER USUARIO ACTUAL
# =========================================================

def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(
        security
    )
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
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
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
            "correo": usuario.correo,
            "es_admin": usuario.es_admin
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
# RECUPERAR CONTRASEÑA - ENVIAR CÓDIGO
# =========================================================

@app.post("/usuarios/recuperar")
def solicitar_recuperacion(
    datos: SolicitarRecuperacion
):

    with Session(engine) as session:

        usuario = session.exec(
            select(Usuario).where(
                Usuario.correo == datos.correo
            )
        ).first()

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="No existe una cuenta con ese correo"
            )

        # Generar código de 6 dígitos
        codigo = str(
            random.randint(
                100000,
                999999
            )
        )

        # Código válido durante 24 horas
        fecha_expiracion = (
            datetime.now(timezone.utc)
            + timedelta(hours=24)
        ).isoformat()

        # Invalidar códigos anteriores
        codigos_anteriores = session.exec(
            select(CodigoRecuperacion).where(
                CodigoRecuperacion.usuario_id == usuario.id,
                CodigoRecuperacion.utilizado == False
            )
        ).all()

        for codigo_anterior in codigos_anteriores:

            codigo_anterior.utilizado = True

            session.add(codigo_anterior)

        # Crear nuevo código
        nuevo_codigo = CodigoRecuperacion(
            usuario_id=usuario.id,
            codigo=codigo,
            fecha_expiracion=fecha_expiracion,
            utilizado=False
        )

        session.add(nuevo_codigo)
        session.commit()

    # Enviar correo después de guardar el código
    enviar_correo_recuperacion(
        datos.correo,
        codigo
    )

    return {
        "mensaje": "Se envió un código de recuperación al correo"
    }


# =========================================================
# VERIFICAR CÓDIGO
# =========================================================

@app.post("/usuarios/verificar-codigo")
def verificar_codigo(
    datos: VerificarCodigo
):

    with Session(engine) as session:

        usuario = session.exec(
            select(Usuario).where(
                Usuario.correo == datos.correo
            )
        ).first()

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="No existe una cuenta con ese correo"
            )

        codigo_recuperacion = session.exec(
            select(CodigoRecuperacion).where(
                CodigoRecuperacion.usuario_id == usuario.id,
                CodigoRecuperacion.codigo == datos.codigo,
                CodigoRecuperacion.utilizado == False
            )
        ).first()

        if not codigo_recuperacion:

            raise HTTPException(
                status_code=400,
                detail="Código incorrecto o ya utilizado"
            )

        fecha_expiracion = datetime.fromisoformat(
            codigo_recuperacion.fecha_expiracion
        )

        if datetime.now(timezone.utc) > fecha_expiracion:

            raise HTTPException(
                status_code=400,
                detail="El código ha expirado"
            )

        return {
            "mensaje": "Código correcto"
        }


# =========================================================
# CAMBIAR CONTRASEÑA
# =========================================================

@app.post("/usuarios/nueva-contrasena")
def cambiar_contrasena(
    datos: NuevaContrasena
):

    with Session(engine) as session:

        usuario = session.exec(
            select(Usuario).where(
                Usuario.correo == datos.correo
            )
        ).first()

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        codigo_recuperacion = session.exec(
            select(CodigoRecuperacion).where(
                CodigoRecuperacion.usuario_id == usuario.id,
                CodigoRecuperacion.codigo == datos.codigo,
                CodigoRecuperacion.utilizado == False
            )
        ).first()

        if not codigo_recuperacion:

            raise HTTPException(
                status_code=400,
                detail="Código incorrecto o ya utilizado"
            )

        fecha_expiracion = datetime.fromisoformat(
            codigo_recuperacion.fecha_expiracion
        )

        if datetime.now(timezone.utc) > fecha_expiracion:

            raise HTTPException(
                status_code=400,
                detail="El código ha expirado"
            )

        # Guardar nueva contraseña hasheada
        usuario.password = password_hash.hash(
            datos.nueva_password
        )

        # Marcar código como utilizado
        codigo_recuperacion.utilizado = True

        session.add(usuario)
        session.add(codigo_recuperacion)

        session.commit()

        return {
            "mensaje": "Contraseña actualizada correctamente"
        }


# =========================================================
# LISTAR USUARIOS
# =========================================================

@app.get(
    "/usuarios",
    response_model=list[UsuarioRespuesta]
)
def listar_usuarios(
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
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
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):

    return usuario_actual


# =========================================================
# ACTUALIZAR MI PERFIL
# =========================================================

@app.put(
    "/usuarios/me",
    response_model=UsuarioRespuesta
)
def actualizar_mi_perfil(
    datos: UsuarioActualizar,
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):

    with Session(engine) as session:

        usuario = session.get(
            Usuario,
            usuario_actual.id
        )

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )

        usuario_existente = session.exec(
            select(Usuario).where(
                Usuario.correo == datos.correo,
                Usuario.id != usuario.id
            )
        ).first()

        if usuario_existente:

            raise HTTPException(
                status_code=400,
                detail="El correo ya está registrado por otro usuario"
            )

        usuario.nombre = datos.nombre
        usuario.correo = datos.correo

        session.add(usuario)
        session.commit()
        session.refresh(usuario)

        return usuario


# =========================================================
# ADMIN - LISTAR USUARIOS
# =========================================================

@app.get(
    "/admin/usuarios",
    response_model=list[UsuarioRespuesta]
)
def listar_usuarios_admin(
    administrador: Usuario = Depends(
        obtener_admin_actual
    )
):

    with Session(engine) as session:

        usuarios = session.exec(
            select(Usuario)
        ).all()

        return usuarios


# =========================================================
# ADMIN - CONVERTIR / QUITAR ADMINISTRADOR
# =========================================================

@app.put(
    "/admin/usuarios/{usuario_id}/admin",
    response_model=UsuarioRespuesta
)
def cambiar_estado_admin(
    usuario_id: int,
    administrador: Usuario = Depends(
        obtener_admin_actual
    )
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

        # No permitir que un administrador se quite
        # sus propios permisos accidentalmente
        if usuario.id == administrador.id:

            raise HTTPException(
                status_code=400,
                detail="No puedes cambiar tus propios permisos de administrador"
            )

        # Cambiar estado
        usuario.es_admin = not usuario.es_admin

        session.add(usuario)
        session.commit()
        session.refresh(usuario)

        return usuario


# =========================================================
# ADMIN - ELIMINAR USUARIO
# =========================================================

@app.delete(
    "/admin/usuarios/{usuario_id}"
)
def eliminar_usuario_admin(
    usuario_id: int,
    administrador: Usuario = Depends(
        obtener_admin_actual
    )
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

        # No permitir eliminarse a sí mismo
        if usuario.id == administrador.id:

            raise HTTPException(
                status_code=400,
                detail="No puedes eliminar tu propia cuenta desde el panel de administración"
            )

        # -------------------------------------------------
        # Eliminar entregas relacionadas con los puntos
        # del usuario
        # -------------------------------------------------

        puntos_usuario = session.exec(
            select(Punto).where(
                Punto.usuario_id == usuario.id
            )
        ).all()

        for punto in puntos_usuario:

            entregas_punto = session.exec(
                select(Entrega).where(
                    Entrega.punto_id == punto.id
                )
            ).all()

            for entrega in entregas_punto:
                session.delete(entrega)

        # -------------------------------------------------
        # Eliminar entregas realizadas por el usuario
        # -------------------------------------------------

        entregas_usuario = session.exec(
            select(Entrega).where(
                Entrega.usuario_id == usuario.id
            )
        ).all()

        for entrega in entregas_usuario:
            session.delete(entrega)

        # -------------------------------------------------
        # Eliminar puntos creados por el usuario
        # -------------------------------------------------

        for punto in puntos_usuario:
            session.delete(punto)

        # -------------------------------------------------
        # Eliminar codigos de recuperacion del usuario
        # -------------------------------------------------

        codigos_usuario = session.exec(
            select(CodigoRecuperacion).where(
                CodigoRecuperacion.usuario_id == usuario.id
            )
        ).all()

        for codigo in codigos_usuario:
            session.delete(codigo)

        # -------------------------------------------------
        # Eliminar usuario
        # -------------------------------------------------

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
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
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
            foto_url=datos.foto_url,
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
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
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
    administrador: Usuario = Depends(
        obtener_admin_actual
    )
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
    administrador: Usuario = Depends(
        obtener_admin_actual
    )
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

        # Buscar al usuario que creó el punto
        usuario = session.get(
            Usuario,
            punto.usuario_id
        )

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuario propietario del punto no encontrado"
            )

        # Cambiar estado
        punto.estado = "aprobado"

        session.add(punto)
        session.commit()
        session.refresh(punto)

        # Enviar notificación después de guardar el cambio
        enviar_notificacion_punto(
            correo_destino=usuario.correo,
            nombre_usuario=usuario.nombre,
            nombre_punto=punto.nombre,
            estado="aprobado"
        )

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
    datos: PuntoRechazo = None,
    administrador: Usuario = Depends(
        obtener_admin_actual
    )
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

        # Buscar al usuario que creó el punto
        usuario = session.get(
            Usuario,
            punto.usuario_id
        )

        if not usuario:

            raise HTTPException(
                status_code=404,
                detail="Usuario propietario del punto no encontrado"
            )

        # Cambiar estado y guardar motivo_rechazo si se proporciona
        punto.estado = "rechazado"
        if datos and datos.motivo_rechazo:
            punto.motivo_rechazo = datos.motivo_rechazo

        session.add(punto)
        session.commit()
        session.refresh(punto)

        # Enviar notificación después de guardar el cambio
        enviar_notificacion_punto(
            correo_destino=usuario.correo,
            nombre_usuario=usuario.nombre,
            nombre_punto=punto.nombre,
            estado="rechazado",
            motivo_rechazo=punto.motivo_rechazo
        )

        return punto

# =========================================================
# REGISTRAR ENTREGA / DONACIÓN / RECICLAJE
# =========================================================

@app.post(
    "/entregas",
    response_model=EntregaRespuesta
)
def registrar_entrega(
    datos: EntregaRegistro,
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):

    with Session(engine) as session:

        # Verificar que el punto exista
        punto = session.get(
            Punto,
            datos.punto_id
        )

        if not punto:
            raise HTTPException(
                status_code=404,
                detail="Punto no encontrado"
            )

        # Verificar que el punto esté aprobado
        if punto.estado != "aprobado":
            raise HTTPException(
                status_code=400,
                detail="No puedes registrar una entrega en un punto que no está aprobado"
            )

        # Validar cantidad
        if datos.cantidad <= 0:
            raise HTTPException(
                status_code=400,
                detail="La cantidad debe ser mayor que 0"
            )

        nueva_entrega = Entrega(
            usuario_id=usuario_actual.id,
            punto_id=datos.punto_id,
            tipo=datos.tipo,
            cantidad=datos.cantidad,
            unidad=datos.unidad,
            estado="registrada"
        )

        session.add(nueva_entrega)
        session.commit()
        session.refresh(nueva_entrega)

        return nueva_entrega


# =========================================================
# OBTENER MI HISTORIAL DE ENTREGAS
# =========================================================

@app.get(
    "/entregas/mis-entregas",
    response_model=list[EntregaRespuesta]
)
def listar_mis_entregas(
    usuario_actual: Usuario = Depends(
        obtener_usuario_actual
    )
):

    with Session(engine) as session:

        entregas = session.exec(
            select(Entrega)
            .where(
                Entrega.usuario_id == usuario_actual.id
            )
            .order_by(
                Entrega.fecha.desc()
            )
        ).all()

        return entregas
