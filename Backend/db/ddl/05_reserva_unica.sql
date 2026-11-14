-- Una sola RESERVA por pedido (decidido el 14-11-2026), para que la reserva sea idempotente:
-- si e-Commerce reintenta, la BD rechaza la segunda aunque las dos llamadas lleguen a la vez.
-- Incluye las reservas ANULADO: un pedido cancelado no se reactiva; se crea otro con un id nuevo.
-- Se puede ejecutar más de una vez.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reserva_por_pedido
  ON inventario.inv_movimiento (id_pedido)
  WHERE tipo_operacion = 'RESERVA';

COMMIT;
