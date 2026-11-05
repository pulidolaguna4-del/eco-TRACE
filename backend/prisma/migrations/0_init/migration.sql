-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."codigos_recuperacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "codigo" VARCHAR NOT NULL,
    "fecha_expiracion" VARCHAR NOT NULL,
    "utilizado" BOOLEAN NOT NULL,

    CONSTRAINT "codigos_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entregas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "punto_id" INTEGER NOT NULL,
    "tipo" VARCHAR NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" VARCHAR NOT NULL,
    "fecha" TIMESTAMP(6) NOT NULL,
    "estado" VARCHAR NOT NULL,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."punto_categoria" (
    "punto_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "punto_categoria_pkey" PRIMARY KEY ("punto_id","categoria_id")
);

-- CreateTable
CREATE TABLE "public"."puntos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "descripcion" VARCHAR NOT NULL,
    "direccion" VARCHAR NOT NULL,
    "localidad" VARCHAR NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "estado" VARCHAR NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL,
    "foto_url" VARCHAR,
    "motivo_rechazo" VARCHAR,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reportes" (
    "id" SERIAL NOT NULL,
    "punto_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" VARCHAR NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL,
    "observacion_admin" VARCHAR(500),

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR NOT NULL,
    "correo" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "es_admin" BOOLEAN NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "public"."categorias"("nombre" ASC);

-- CreateIndex
CREATE INDEX "ix_codigos_recuperacion_usuario_id" ON "public"."codigos_recuperacion"("usuario_id" ASC);

-- CreateIndex
CREATE INDEX "ix_reportes_estado" ON "public"."reportes"("estado" ASC);

-- CreateIndex
CREATE INDEX "ix_reportes_punto_id" ON "public"."reportes"("punto_id" ASC);

-- CreateIndex
CREATE INDEX "ix_reportes_usuario_id" ON "public"."reportes"("usuario_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ix_usuarios_correo" ON "public"."usuarios"("correo" ASC);

-- AddForeignKey
ALTER TABLE "public"."codigos_recuperacion" ADD CONSTRAINT "codigos_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."entregas" ADD CONSTRAINT "entregas_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "public"."puntos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."entregas" ADD CONSTRAINT "entregas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."punto_categoria" ADD CONSTRAINT "punto_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."punto_categoria" ADD CONSTRAINT "punto_categoria_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "public"."puntos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."puntos" ADD CONSTRAINT "puntos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reportes" ADD CONSTRAINT "reportes_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "public"."puntos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reportes" ADD CONSTRAINT "reportes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

