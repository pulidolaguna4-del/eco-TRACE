-- =========================================================
-- RESEÑAS DE PUNTOS ECOLÓGICOS (HU-23)
-- =========================================================
-- Tabla de reseñas (una por usuario y punto), promedio y total en
-- el punto, y marca de revisión prioritaria por reseñas negativas.

-- AlterTable
ALTER TABLE "puntos" ADD COLUMN     "calificacion_promedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fecha_revision" TIMESTAMP(6),
ADD COLUMN     "motivo_revision" VARCHAR(255),
ADD COLUMN     "revision_prioritaria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "total_resenas" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "punto_id" INTEGER NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" VARCHAR(500),
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id"),
    -- Prisma no declara CHECK en el esquema: la base garantiza 1 a 5 estrellas
    CONSTRAINT "resenas_puntuacion_check" CHECK ("puntuacion" BETWEEN 1 AND 5)
);

-- CreateIndex
CREATE INDEX "ix_resenas_punto_id" ON "resenas"("punto_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_resenas_usuario_punto" ON "resenas"("usuario_id", "punto_id");

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resenas" ADD CONSTRAINT "resenas_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "puntos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
