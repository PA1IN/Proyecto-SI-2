-- id_empleado opcional solo en movimientos automáticos (decidido el 13-11-2026).
-- e-Commerce reserva y libera sin un empleado detrás: NULL = lo hizo el sistema.
-- Los movimientos que registra una persona (ingreso, ajuste, egreso, devolución) siguen
-- exigiendo id_empleado. La futura FK a rrhh.empleado acepta NULL sin cambios.
-- Se puede ejecutar más de una vez.

BEGIN;

ALTER TABLE inventario.inv_movimiento
  ALTER COLUMN id_empleado DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_empleado_requerido'
      AND conrelid = 'inventario.inv_movimiento'::regclass
  ) THEN
    ALTER TABLE inventario.inv_movimiento
      ADD CONSTRAINT chk_empleado_requerido CHECK (
        id_empleado IS NOT NULL OR tipo_operacion IN ('RESERVA', 'LIBERACION'));
  END IF;
END $$;

COMMIT;
