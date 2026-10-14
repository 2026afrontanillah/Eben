-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'VENDEDOR', 'RELACIONADOR', 'CONTROL');

-- CreateEnum
CREATE TYPE "TipoZona" AS ENUM ('GENERAL', 'NUMERADA');

-- CreateEnum
CREATE TYPE "EstadoAsiento" AS ENUM ('DISPONIBLE', 'VENDIDO');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('CONFIRMADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoEntrada" AS ENUM ('VALIDA', 'USADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'QR', 'TRANSFERENCIA', 'TARJETA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "lugar" TEXT,
    "fecha" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "plano_columnas" TEXT NOT NULL,
    "plano_filas" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" UUID NOT NULL,
    "evento_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoZona" NOT NULL,
    "precio_centavos" INTEGER,
    "capacidad" INTEGER NOT NULL,
    "disponibles" INTEGER NOT NULL,
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "area_plano" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "mesas" INTEGER,
    "sillas_por_mesa" INTEGER,
    "mesas_por_fila" INTEGER,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos" (
    "id" UUID NOT NULL,
    "zona_id" UUID NOT NULL,
    "mesa" INTEGER NOT NULL,
    "silla" INTEGER NOT NULL,
    "estado" "EstadoAsiento" NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT "asientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "evento_id" UUID NOT NULL,
    "zona_id" UUID NOT NULL,
    "vendedor_id" UUID NOT NULL,
    "cliente_nombre" TEXT NOT NULL,
    "cliente_celular" TEXT NOT NULL,
    "cliente_email" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario_centavos" INTEGER NOT NULL,
    "total_centavos" INTEGER NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'CONFIRMADA',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulada_en" TIMESTAMP(3),
    "anulada_por_id" UUID,
    "motivo_anulacion" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "venta_id" UUID NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "monto_centavos" INTEGER NOT NULL,
    "referencia" TEXT,
    "registrado_por_id" UUID NOT NULL,
    "registrado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entradas" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "venta_id" UUID NOT NULL,
    "zona_id" UUID NOT NULL,
    "asiento_id" UUID,
    "estado" "EstadoEntrada" NOT NULL DEFAULT 'VALIDA',
    "usada_en" TIMESTAMP(3),
    "validada_por_id" UUID,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entradas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_token_hash_key" ON "sesiones"("token_hash");

-- CreateIndex
CREATE INDEX "sesiones_usuario_id_idx" ON "sesiones"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_evento_id_codigo_key" ON "zonas"("evento_id", "codigo");

-- CreateIndex
CREATE INDEX "asientos_zona_id_estado_idx" ON "asientos"("zona_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "asientos_zona_id_mesa_silla_key" ON "asientos"("zona_id", "mesa", "silla");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_codigo_key" ON "ventas"("codigo");

-- CreateIndex
CREATE INDEX "ventas_evento_id_creada_en_idx" ON "ventas"("evento_id", "creada_en");

-- CreateIndex
CREATE INDEX "ventas_vendedor_id_creada_en_idx" ON "ventas"("vendedor_id", "creada_en");

-- CreateIndex
CREATE INDEX "pagos_venta_id_idx" ON "pagos"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "entradas_codigo_key" ON "entradas"("codigo");

-- CreateIndex
CREATE INDEX "entradas_venta_id_idx" ON "entradas"("venta_id");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas" ADD CONSTRAINT "zonas_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos" ADD CONSTRAINT "asientos_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_anulada_por_id_fkey" FOREIGN KEY ("anulada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_asiento_id_fkey" FOREIGN KEY ("asiento_id") REFERENCES "asientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entradas" ADD CONSTRAINT "entradas_validada_por_id_fkey" FOREIGN KEY ("validada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integridad de stock y montos: la base de datos rechaza cualquier escritura que deje datos imposibles,
-- aunque un error en la aplicación intente guardarlos.
ALTER TABLE "zonas"
  ADD CONSTRAINT "zonas_capacidad_no_negativa" CHECK ("capacidad" >= 0),
  ADD CONSTRAINT "zonas_disponibles_en_rango" CHECK ("disponibles" >= 0 AND "disponibles" <= "capacidad"),
  ADD CONSTRAINT "zonas_precio_positivo" CHECK ("precio_centavos" IS NULL OR "precio_centavos" > 0);

ALTER TABLE "asientos"
  ADD CONSTRAINT "asientos_numeracion_positiva" CHECK ("mesa" >= 1 AND "silla" >= 1);

ALTER TABLE "ventas"
  ADD CONSTRAINT "ventas_cantidad_positiva" CHECK ("cantidad" > 0),
  ADD CONSTRAINT "ventas_total_consistente" CHECK ("total_centavos" = "precio_unitario_centavos" * "cantidad");

ALTER TABLE "pagos"
  ADD CONSTRAINT "pagos_monto_positivo" CHECK ("monto_centavos" > 0);
