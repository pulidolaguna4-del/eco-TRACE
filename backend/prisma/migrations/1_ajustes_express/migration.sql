-- AlterTable
ALTER TABLE "codigos_recuperacion" ALTER COLUMN "utilizado" SET DEFAULT false;

-- AlterTable
ALTER TABLE "entregas" ADD COLUMN     "observacion" VARCHAR,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "estado" SET DEFAULT 'registrada';

-- AlterTable
ALTER TABLE "puntos" ALTER COLUMN "estado" SET DEFAULT 'pendiente',
ALTER COLUMN "fecha_creacion" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "reportes" ALTER COLUMN "estado" SET DEFAULT 'pendiente',
ALTER COLUMN "fecha_creacion" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "es_admin" SET DEFAULT false;

