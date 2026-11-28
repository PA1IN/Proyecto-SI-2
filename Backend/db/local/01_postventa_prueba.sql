-- Solo para el Postgres local; nunca ejecutar en Neon.
-- Tablas de prueba del schema postventa (mismos tipos y nulabilidad que en Neon)
-- para probar la integración de devoluciones sin tocar la BD compartida.

BEGIN;

CREATE SCHEMA IF NOT EXISTS postventa;

CREATE TABLE IF NOT EXISTS postventa.reclamo (
  id_reclamo   integer PRIMARY KEY,
  id_venta     integer NOT NULL,
  id_cliente   integer NOT NULL,
  motivo       text    NOT NULL,
  estado       text    NOT NULL,
  descripcion  text
);

CREATE TABLE IF NOT EXISTS postventa.devolucion (
  id_devolucion     integer PRIMARY KEY,
  id_reclamo        integer NOT NULL REFERENCES postventa.reclamo (id_reclamo),
  id_producto       integer NOT NULL,
  cantidad          integer NOT NULL,
  id_detalle_ped    integer NOT NULL,
  fecha_devolucion  date    NOT NULL,
  motivo            text    NOT NULL
);

INSERT INTO postventa.reclamo (id_reclamo, id_venta, id_cliente, motivo, estado, descripcion) VALUES
  (1, 1001, 10, 'Cambio de opinión', 'APROBADO', 'Cliente devuelve set sellado'),
  (2, 1002, 11, 'Caja dañada', 'APROBADO', 'Caja aplastada en transporte'),
  (3, 1003, 12, 'Error de registro', 'PENDIENTE', 'Cantidad en 0 para probar validación 400'),
  (4, 1004, 13, 'Set desconocido', 'APROBADO', 'Producto inexistente para probar validación 404')
ON CONFLICT (id_reclamo) DO NOTHING;

-- Casos de prueba:
-- 1: normal (para probar apto = true)
-- 2: normal (para probar apto = false / dañado)
-- 3: cantidad = 0 (para probar rechazo 400)
-- 4: id_producto = 99999 inexistente (para probar rechazo 404)
INSERT INTO postventa.devolucion (id_devolucion, id_reclamo, id_producto, cantidad, id_detalle_ped, fecha_devolucion, motivo) VALUES
  (1, 1, 1, 2, 101, '2026-11-25', 'Set sin abrir'),
  (2, 2, 2, 1, 102, '2026-11-26', 'Caja golpeada'),
  (3, 3, 3, 0, 103, '2026-11-26', 'Cantidad inválida'),
  (4, 4, 99999, 1, 104, '2026-11-27', 'Producto no existe en catálogo')
ON CONFLICT (id_devolucion) DO NOTHING;

COMMIT;