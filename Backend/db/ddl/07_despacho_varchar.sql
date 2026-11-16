-- id_despacho guarda el id de la guía de Logística, que es texto (GD-52341). Acordado el 16-11-2026.
-- El UNIQUE se mantiene: un mismo despacho no se registra dos veces (idempotencia del despacho).
-- La tabla está vacía hasta el Sprint 3, así que el cambio no toca datos.
-- Se puede ejecutar más de una vez.

BEGIN;

ALTER TABLE inventario.inv_despachos_operario
  ALTER COLUMN id_despacho TYPE varchar(50) USING id_despacho::varchar(50);

COMMIT;
