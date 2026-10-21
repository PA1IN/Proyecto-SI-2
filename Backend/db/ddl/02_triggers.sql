-- Inmutabilidad de movimientos (trazabilidad). Los errores se corrigen con un AJUSTE.
-- inv_movimiento: nunca DELETE; UPDATE solo para cerrar una RESERVA PENDIENTE
--                 (estado -> COMPLETADO o ANULADO) sin tocar otra columna.
-- inv_detalles_movimiento: nunca UPDATE ni DELETE.

BEGIN;

CREATE OR REPLACE FUNCTION inventario.fn_movimiento_inmutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'El movimiento % no se puede eliminar; corrija con un AJUSTE', OLD.id_movimiento;
  END IF;
  IF OLD.estado <> 'PENDIENTE'
     OR NEW.estado NOT IN ('COMPLETADO', 'ANULADO')
     OR (to_jsonb(NEW) - 'estado') <> (to_jsonb(OLD) - 'estado') THEN
    RAISE EXCEPTION 'El movimiento % es inmutable: solo se puede cerrar una RESERVA PENDIENTE', OLD.id_movimiento;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_movimiento_inmutable
  BEFORE UPDATE OR DELETE ON inventario.inv_movimiento
  FOR EACH ROW EXECUTE FUNCTION inventario.fn_movimiento_inmutable();

CREATE OR REPLACE FUNCTION inventario.fn_detalle_inmutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'El detalle % de un movimiento no se puede modificar ni eliminar', OLD.id_detalle;
END;
$$;

CREATE OR REPLACE TRIGGER trg_detalle_inmutable
  BEFORE UPDATE OR DELETE ON inventario.inv_detalles_movimiento
  FOR EACH ROW EXECUTE FUNCTION inventario.fn_detalle_inmutable();

COMMIT;
