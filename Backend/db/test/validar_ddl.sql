-- Verifica las restricciones y triggers del DDL. Todo termina en ROLLBACK: no deja datos.
-- Usar solo en el Postgres local (avanza las secuencias aunque haga ROLLBACK).

BEGIN;

DO $$
DECLARE
  t int; p int; b int; m int; r1 int; r2 int; d int;
  ok boolean;
BEGIN
  INSERT INTO inventario.inv_temas (nombre_tema) VALUES ('Tema prueba') RETURNING id_tema INTO t;
  INSERT INTO inventario.inv_producto (id_tema, sku, nombre_set, cant_piezas)
    VALUES (t, 'TEST-1', 'Set prueba', 10) RETURNING id_producto INTO p;
  INSERT INTO inventario.inv_bodegas (nombre_bodega, ubicacion_fisica)
    VALUES ('Bodega prueba', 'Coquimbo') RETURNING id_bodega INTO b;
  INSERT INTO inventario.inv_stock_bodega (id_producto, id_bodega, cantidad_disponible)
    VALUES (p, b, 5);
  INSERT INTO inventario.inv_movimiento (id_empleado, tipo_operacion, estado)
    VALUES (1, 'INGRESO', 'COMPLETADO') RETURNING id_movimiento INTO m;
  INSERT INTO inventario.inv_detalles_movimiento (id_movimiento, id_producto, id_bodega, cantidad)
    VALUES (m, p, b, 5) RETURNING id_detalle INTO d;
  INSERT INTO inventario.inv_movimiento (id_empleado, id_pedido, tipo_operacion, estado)
    VALUES (1, 100, 'RESERVA', 'PENDIENTE') RETURNING id_movimiento INTO r1;
  INSERT INTO inventario.inv_movimiento (id_empleado, id_pedido, tipo_operacion, estado)
    VALUES (1, 101, 'RESERVA', 'PENDIENTE') RETURNING id_movimiento INTO r2;

  ok := false;
  BEGIN
    UPDATE inventario.inv_stock_bodega SET cantidad_disponible = -1 WHERE id_producto = p AND id_bodega = b;
  EXCEPTION WHEN check_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió stock negativo';

  ok := false;
  BEGIN
    INSERT INTO inventario.inv_producto (id_tema, sku, nombre_set, cant_piezas) VALUES (t, 'TEST-1', 'Duplicado', 1);
  EXCEPTION WHEN unique_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió un SKU duplicado';

  ok := false;
  BEGIN
    INSERT INTO inventario.inv_movimiento (id_empleado, tipo_operacion, estado) VALUES (1, 'INGRESO', 'PENDIENTE');
  EXCEPTION WHEN check_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió un INGRESO PENDIENTE';

  ok := false;
  BEGIN
    INSERT INTO inventario.inv_movimiento (id_empleado, tipo_operacion, estado) VALUES (1, 'RESERVA', 'PENDIENTE');
  EXCEPTION WHEN check_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió una RESERVA sin id_pedido';

  ok := false;
  BEGIN
    INSERT INTO inventario.inv_detalles_movimiento (id_movimiento, id_producto, id_bodega, cantidad) VALUES (m, p, b, 0);
  EXCEPTION WHEN check_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió un detalle con cantidad 0';

  ok := false;
  BEGIN
    DELETE FROM inventario.inv_producto WHERE id_producto = p;
  EXCEPTION WHEN foreign_key_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió borrar un producto con stock y movimientos';

  ok := false;
  BEGIN
    DELETE FROM inventario.inv_movimiento WHERE id_movimiento = m;
  EXCEPTION WHEN raise_exception THEN ok := true; END;
  ASSERT ok, 'Se permitió borrar un movimiento';

  ok := false;
  BEGIN
    UPDATE inventario.inv_movimiento SET estado = 'ANULADO' WHERE id_movimiento = m;
  EXCEPTION WHEN raise_exception OR check_violation THEN ok := true; END;
  ASSERT ok, 'Se permitió cambiar un movimiento COMPLETADO';

  ok := false;
  BEGIN
    UPDATE inventario.inv_movimiento SET estado = 'COMPLETADO', id_pedido = 999 WHERE id_movimiento = r2;
  EXCEPTION WHEN raise_exception THEN ok := true; END;
  ASSERT ok, 'Se permitió cambiar otra columna al cerrar una RESERVA';

  ok := false;
  BEGIN
    UPDATE inventario.inv_detalles_movimiento SET cantidad = 9 WHERE id_detalle = d;
  EXCEPTION WHEN raise_exception THEN ok := true; END;
  ASSERT ok, 'Se permitió modificar un detalle';

  -- Caso permitido: cerrar una RESERVA PENDIENTE.
  UPDATE inventario.inv_movimiento SET estado = 'COMPLETADO' WHERE id_movimiento = r1;

  RAISE NOTICE 'Validación del DDL: OK (10 rechazos esperados y 1 cierre de reserva permitido)';
END;
$$;

ROLLBACK;
