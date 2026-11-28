-- Reglas de integridad para la recepción de devoluciones de Postventa (Sprint 3, S3.8).
-- 1) uq_devolucion_unica: una sola recepción DEVOLUCION por id_devolucion (idempotencia / concurrencia).
--    Al ser parcial, permite registrar un AJUSTE con el mismo id_devolucion si el producto no está apto.
-- 2) chk_devolucion_requerida: todo movimiento DEVOLUCION debe traer id_devolucion.
-- Se puede ejecutar más de una vez sin error.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_devolucion_unica
  ON inventario.inv_movimiento (id_devolucion)
  WHERE tipo_operacion = 'DEVOLUCION';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_devolucion_requerida'
      AND conrelid = 'inventario.inv_movimiento'::regclass
  ) THEN
    ALTER TABLE inventario.inv_movimiento
      ADD CONSTRAINT chk_devolucion_requerida CHECK (
        tipo_operacion <> 'DEVOLUCION' OR id_devolucion IS NOT NULL);
  END IF;
END $$;

COMMIT;