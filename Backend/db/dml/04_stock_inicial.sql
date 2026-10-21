-- Carga inicial de stock: un INGRESO por bodega con sus líneas de detalle, y el stock
-- calculado desde esos detalles, para que stock y movimientos cuadren desde el inicio.
-- Cantidades deterministas (no aleatorias): el resultado es el mismo en local y en Neon.
-- Algunas quedan bajo cantidad_minima (5) para poder probar la alerta de stock bajo.

BEGIN;

DO $$
DECLARE
  b int;
  m int;
BEGIN
  -- Evita duplicar la carga si el script se ejecuta de nuevo.
  IF EXISTS (SELECT 1 FROM inventario.inv_movimiento) THEN
    RAISE NOTICE 'Ya existen movimientos: se omite la carga inicial de stock';
    RETURN;
  END IF;

  FOR b IN SELECT id_bodega FROM inventario.inv_bodegas ORDER BY id_bodega LOOP
    -- id_empleado 1 es provisorio hasta tener el maestro de RRHH (Sprint 3).
    INSERT INTO inventario.inv_movimiento (id_empleado, fecha_registro, tipo_operacion, estado)
      VALUES (1, timestamptz '2026-10-01 09:00:00-03' + (b - 1) * interval '30 minutes', 'INGRESO', 'COMPLETADO')
      RETURNING id_movimiento INTO m;

    -- Cada producto queda en unas 3 o 4 de las 10 bodegas, con 1 a 30 unidades.
    INSERT INTO inventario.inv_detalles_movimiento (id_movimiento, id_producto, id_bodega, cantidad)
      SELECT m, p.id_producto, b, 1 + (p.id_producto * 7 + b * 3) % 30
      FROM inventario.inv_producto p
      WHERE (p.id_producto + b) % 3 = 0;
  END LOOP;

  INSERT INTO inventario.inv_stock_bodega (id_producto, id_bodega, cantidad_disponible, cantidad_minima)
    SELECT id_producto, id_bodega, sum(cantidad), 5
    FROM inventario.inv_detalles_movimiento
    GROUP BY id_producto, id_bodega;
END;
$$;

COMMIT;
