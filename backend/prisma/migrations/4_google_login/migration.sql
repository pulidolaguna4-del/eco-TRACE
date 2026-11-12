-- =========================================================
-- INICIO DE SESIÓN CON GOOGLE
-- =========================================================
-- Las cuentas creadas con Google no tienen contraseña, y se guarda el
-- identificador de la cuenta de Google ("sub" del ID token).

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "password" DROP NOT NULL,
ADD COLUMN     "google_id" VARCHAR;

-- CreateIndex
CREATE UNIQUE INDEX "ix_usuarios_google_id" ON "usuarios"("google_id");
