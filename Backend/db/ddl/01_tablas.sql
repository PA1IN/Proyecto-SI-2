-- Tablas del módulo Inventario, schema inventario.
-- Sin DROP: se puede ejecutar varias veces sin borrar datos (IF NOT EXISTS).
-- Las columnas que apuntan a otros módulos son int sin FK hasta el Sprint 3, cuando
-- existan esas tablas: id_empleado, id_pedido, id_devolucion, id_despacho, id_proveedor, id_oc.

BEGIN;

CREATE TABLE IF NOT EXISTS inventario.inv_temas (
  id_tema      serial       PRIMARY KEY,
  nombre_tema  varchar(100) NOT NULL
);

-- Maestro canónico de productos (id_producto). El precio vive en e-Commerce.
CREATE TABLE IF NOT EXISTS inventario.inv_producto (
  id_producto  serial       PRIMARY KEY,
  id_tema      int          NOT NULL REFERENCES inventario.inv_temas (id_tema) ON DELETE RESTRICT,
  sku          varchar(20)  NOT NULL UNIQUE,  -- número de set LEGO, p. ej. 75192-1
  nombre_set   varchar(255) NOT NULL,
  cant_piezas  int          NOT NULL CHECK (cant_piezas >= 0),
  activo       boolean      NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS inventario.inv_bodegas (
  id_bodega         serial       PRIMARY KEY,
  nombre_bodega     varchar(100) NOT NULL UNIQUE,
  ubicacion_fisica  varchar(255) NOT NULL
);

-- Los CHECK >= 0 son la última barrera contra stock negativo; el backend usa UPDATE condicional.
CREATE TABLE IF NOT EXISTS inventario.inv_stock_bodega (
  id_producto          int NOT NULL REFERENCES inventario.inv_producto (id_producto) ON DELETE RESTRICT,
  id_bodega            int NOT NULL REFERENCES inventario.inv_bodegas (id_bodega) ON DELETE RESTRICT,
  cantidad_disponible  int NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
  cantidad_reservada   int NOT NULL DEFAULT 0 CHECK (cantidad_reservada >= 0),
  cantidad_minima      int NOT NULL DEFAULT 0 CHECK (cantidad_minima >= 0),
  PRIMARY KEY (id_producto, id_bodega)
);

CREATE TABLE IF NOT EXISTS inventario.inv_movimiento (
  id_movimiento   serial      PRIMARY KEY,
  id_empleado     int         NOT NULL,  -- TODO Sprint 3: FK a rrhh (empleado)
  id_pedido       int,                   -- TODO Sprint 3: FK a ecommerce_ventas (pedido)
  id_devolucion   int,                   -- TODO Sprint 3: FK a postventa (devolución)
  fecha_registro  timestamptz NOT NULL DEFAULT now(),
  tipo_operacion  varchar(20) NOT NULL CHECK (tipo_operacion IN
                    ('INGRESO', 'EGRESO', 'RESERVA', 'LIBERACION', 'AJUSTE', 'DEVOLUCION')),
  estado          varchar(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'COMPLETADO', 'ANULADO')),
  -- Solo una RESERVA puede estar PENDIENTE o ANULADA; los demás tipos nacen COMPLETADO.
  CONSTRAINT chk_estado_segun_tipo CHECK (tipo_operacion = 'RESERVA' OR estado = 'COMPLETADO'),
  -- Reserva, egreso y liberación siempre corresponden a un pedido.
  CONSTRAINT chk_pedido_requerido CHECK (
    tipo_operacion NOT IN ('RESERVA', 'EGRESO', 'LIBERACION') OR id_pedido IS NOT NULL)
);

-- cantidad es negativa solo en un AJUSTE que descuenta; el backend valida el signo según el tipo.
CREATE TABLE IF NOT EXISTS inventario.inv_detalles_movimiento (
  id_detalle     serial PRIMARY KEY,
  id_movimiento  int    NOT NULL REFERENCES inventario.inv_movimiento (id_movimiento) ON DELETE RESTRICT,
  id_producto    int    NOT NULL REFERENCES inventario.inv_producto (id_producto) ON DELETE RESTRICT,
  id_bodega      int    NOT NULL REFERENCES inventario.inv_bodegas (id_bodega) ON DELETE RESTRICT,
  cantidad       int    NOT NULL CHECK (cantidad <> 0)
);

-- Subtablas: copian el id_movimiento del padre como PK y FK. Quedan vacías hasta el Sprint 3,
-- cuando Logística confirme despachos y Compras/Logística confirmen recepciones.
CREATE TABLE IF NOT EXISTS inventario.inv_despachos_operario (
  id_movimiento          int          PRIMARY KEY REFERENCES inventario.inv_movimiento (id_movimiento) ON DELETE RESTRICT,
  id_despacho            int          NOT NULL UNIQUE,  -- TODO Sprint 3: FK a logistica (despacho). UNIQUE evita procesarlo dos veces
  observaciones_picking  varchar(255)
);

CREATE TABLE IF NOT EXISTS inventario.inv_recepciones_compra (
  id_movimiento       int         PRIMARY KEY REFERENCES inventario.inv_movimiento (id_movimiento) ON DELETE RESTRICT,
  id_proveedor        int         NOT NULL,  -- TODO Sprint 3: FK a compras (proveedor). El backend valida que sea el de la OC
  id_oc               int         NOT NULL,  -- TODO Sprint 3: FK a compras (orden de compra)
  nro_guia_proveedor  varchar(50) NOT NULL,
  -- Una OC puede llegar en varias entregas, pero cada guía se registra una sola vez.
  CONSTRAINT uq_recepcion_oc_guia UNIQUE (id_oc, nro_guia_proveedor)
);

-- Postgres no indexa las FKs por sí solo.
CREATE INDEX IF NOT EXISTS idx_producto_tema       ON inventario.inv_producto (id_tema);
CREATE INDEX IF NOT EXISTS idx_stock_bodega        ON inventario.inv_stock_bodega (id_bodega);
CREATE INDEX IF NOT EXISTS idx_movimiento_pedido   ON inventario.inv_movimiento (id_pedido);
CREATE INDEX IF NOT EXISTS idx_detalle_movimiento  ON inventario.inv_detalles_movimiento (id_movimiento);
CREATE INDEX IF NOT EXISTS idx_detalle_producto    ON inventario.inv_detalles_movimiento (id_producto);

COMMIT;
