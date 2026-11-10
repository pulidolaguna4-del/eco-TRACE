-- =========================================================
-- ENTREGAS SEGÚN EL MER (HU-20)
-- =========================================================
-- Agrega categoría, nombre del artículo, peso (kg), estado de
-- conservación, foto y observación del administrador. Los estados
-- pasan a ser: pendiente -> verificada | rechazada.

-- AlterTable
ALTER TABLE "entregas" ADD COLUMN     "categoria_id" INTEGER,
ADD COLUMN     "estado_conservacion" VARCHAR(20),
ADD COLUMN     "foto_url" VARCHAR,
ADD COLUMN     "nombre_articulo" VARCHAR(120),
ADD COLUMN     "observacion_admin" VARCHAR(500),
ADD COLUMN     "peso" DOUBLE PRECISION,
ALTER COLUMN "estado" SET DEFAULT 'pendiente';

-- CreateIndex
CREATE INDEX "ix_entregas_categoria_id" ON "entregas"("categoria_id");

-- CreateIndex
CREATE INDEX "ix_entregas_estado" ON "entregas"("estado");

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ---------------------------------------------------------
-- Datos existentes
-- ---------------------------------------------------------

-- "registrada" era el único estado: ahora queda pendiente de verificación
UPDATE "entregas" SET "estado" = 'pendiente' WHERE "estado" = 'registrada';

-- Las entregas en kilogramos ya tienen su peso
UPDATE "entregas" SET "peso" = "cantidad"
WHERE "peso" IS NULL AND lower("unidad") = 'kg';

-- La categoría se deduce del tipo que guardaba el formulario anterior
UPDATE "entregas" AS e
SET "categoria_id" = c."id"
FROM "categorias" AS c
WHERE e."categoria_id" IS NULL
  AND (
    (e."tipo" = 'reciclaje'    AND c."nombre" = 'Reciclaje Tradicional') OR
    (e."tipo" = 'ropa'         AND c."nombre" = 'Donación de Ropa') OR
    (e."tipo" = 'electronicos' AND c."nombre" = 'Residuos Electrónicos')
  );
