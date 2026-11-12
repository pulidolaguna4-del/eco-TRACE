-- =========================================================
-- REGALOS (MARKETPLACE GRATUITO)
-- =========================================================
-- Regalos publicados, conversaciones entre quien regala y cada
-- interesado, mensajes del chat y reportes de moderación.

-- CreateTable
CREATE TABLE "regalos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "titulo" VARCHAR(80) NOT NULL,
    "descripcion" VARCHAR(500),
    "categoria" VARCHAR(30) NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" VARCHAR(20) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'disponible',
    "oculto" BOOLEAN NOT NULL DEFAULT false,
    "motivo_ocultamiento" VARCHAR(500),
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "barrio" VARCHAR(80),
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reservado_para_id" INTEGER,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(6) NOT NULL,
    "fecha_entrega" TIMESTAMP(6),

    CONSTRAINT "regalos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" SERIAL NOT NULL,
    "regalo_id" INTEGER NOT NULL,
    "interesado_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultimo_mensaje" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" SERIAL NOT NULL,
    "conversacion_id" INTEGER NOT NULL,
    "remitente_id" INTEGER,
    "texto" VARCHAR(1000) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'usuario',
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leido_en" TIMESTAMP(6),

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportes_regalo" (
    "id" SERIAL NOT NULL,
    "regalo_id" INTEGER NOT NULL,
    "mensaje_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    "observacion_admin" VARCHAR(500),
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_regalo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_regalos_estado" ON "regalos"("estado");

-- CreateIndex
CREATE INDEX "ix_regalos_usuario_id" ON "regalos"("usuario_id");

-- CreateIndex
CREATE INDEX "ix_conversaciones_interesado_id" ON "conversaciones"("interesado_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_conversaciones_regalo_interesado" ON "conversaciones"("regalo_id", "interesado_id");

-- CreateIndex
CREATE INDEX "ix_mensajes_conversacion_fecha" ON "mensajes"("conversacion_id", "fecha");

-- CreateIndex
CREATE INDEX "ix_reportes_regalo_estado" ON "reportes_regalo"("estado");

-- AddForeignKey
ALTER TABLE "regalos" ADD CONSTRAINT "regalos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regalos" ADD CONSTRAINT "regalos_reservado_para_id_fkey" FOREIGN KEY ("reservado_para_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_regalo_id_fkey" FOREIGN KEY ("regalo_id") REFERENCES "regalos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_interesado_id_fkey" FOREIGN KEY ("interesado_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_remitente_id_fkey" FOREIGN KEY ("remitente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_regalo" ADD CONSTRAINT "reportes_regalo_regalo_id_fkey" FOREIGN KEY ("regalo_id") REFERENCES "regalos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_regalo" ADD CONSTRAINT "reportes_regalo_mensaje_id_fkey" FOREIGN KEY ("mensaje_id") REFERENCES "mensajes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_regalo" ADD CONSTRAINT "reportes_regalo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

