-- Peso y medidas de la caja de cada producto, para la cubicación de Logística (acordado el 16-11-2026).
-- Mismos nombres y precisión que usa Logística (log_ot_picking_detalle). Opcionales, pero si vienen
-- deben ser mayores que 0, igual que su validación. El peso volumétrico y los bultos los calcula y
-- guarda Logística: aquí solo va el dato de cada producto.
-- Se puede ejecutar más de una vez.

BEGIN;

ALTER TABLE inventario.inv_producto
  ADD COLUMN IF NOT EXISTS peso_unitario_kg numeric(10,2) CHECK (peso_unitario_kg > 0),
  ADD COLUMN IF NOT EXISTS largo_cm         numeric(10,2) CHECK (largo_cm > 0),
  ADD COLUMN IF NOT EXISTS alto_cm          numeric(10,2) CHECK (alto_cm > 0),
  ADD COLUMN IF NOT EXISTS ancho_cm         numeric(10,2) CHECK (ancho_cm > 0);

COMMIT;
