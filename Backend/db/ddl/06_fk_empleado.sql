-- FK de inv_movimiento.id_empleado hacia el maestro canónico rrhh.empleado (Sprint 3, tarea S3.6).
-- ON DELETE RESTRICT impide borrar empleados que ya tengan movimientos históricos registrados.
-- Los movimientos automáticos (RESERVA, LIBERACION) tienen id_empleado NULL y la FK los permite.
-- Idempotente y seguro en local: solo crea la FK si existe rrhh.empleado y la restricción aún no está.

BEGIN;

DO $$
BEGIN
  IF to_regclass('rrhh.empleado') IS NULL THEN
    RAISE NOTICE 'No existe rrhh.empleado en esta BD (entorno local): se omite fk_movimiento_empleado';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_movimiento_empleado'
      AND conrelid = 'inventario.inv_movimiento'::regclass
  ) THEN
    ALTER TABLE inventario.inv_movimiento
      ADD CONSTRAINT fk_movimiento_empleado
      FOREIGN KEY (id_empleado) REFERENCES rrhh.empleado (id_empleado)
      ON DELETE RESTRICT;
  END IF;
END $$;

COMMIT;