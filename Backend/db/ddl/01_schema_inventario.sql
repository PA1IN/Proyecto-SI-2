-- =========================================================================
-- DDL MÓDULO INVENTARIO (GRUPO 2) - E-COMMERCE LEGO
-- CREADO PARA EL SPRINT 2
-- =========================================================================

-- 1. Tabla de Temas de LEGO
CREATE TABLE IF NOT EXISTS inventario.inv_temas (
    id_tema SERIAL PRIMARY KEY,
    nombre_tema VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Maestro Canónico de Productos (Dueño: Inventario)
CREATE TABLE IF NOT EXISTS inventario.inv_producto (
    id_producto SERIAL PRIMARY KEY,
    id_tema INT NOT NULL REFERENCES inventario.inv_temas(id_tema),
    sku VARCHAR(50) NOT NULL UNIQUE, -- Clave canónica de negocio (ej. '75192')
    nombre_set VARCHAR(200) NOT NULL,
    coleccion VARCHAR(100),
    cant_piezas INT NOT NULL CHECK (cant_piezas >= 0),
    edad_minima INT NOT NULL CHECK (edad_minima >= 0),
    tipo_construccion VARCHAR(50),   -- Ej: Bustos, Mecas, Arte, Vehículos
    stock_minimo INT NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Tabla de Bodegas
CREATE TABLE IF NOT EXISTS inventario.inv_bodegas (
    id_bodega SERIAL PRIMARY KEY,
    nombre_bodega VARCHAR(100) NOT NULL UNIQUE,
    ubicacion_fisica VARCHAR(200) NOT NULL
);

-- 4. Stock por Bodega (Corazón del Inventario)
CREATE TABLE IF NOT EXISTS inventario.inv_stock_bodega (
    id_producto INT NOT NULL REFERENCES inventario.inv_producto(id_producto),
    id_bodega INT NOT NULL REFERENCES inventario.inv_bodegas(id_bodega),
    cantidad_disponible INT NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    cantidad_reservada INT NOT NULL DEFAULT 0 CHECK (cantidad_reservada >= 0),
    PRIMARY KEY (id_producto, id_bodega)
);

-- 5. Cabecera de Movimientos (Kardex inmutable)
CREATE TABLE IF NOT EXISTS inventario.inv_movimiento (
    id_movimiento SERIAL PRIMARY KEY,
    id_empleado INT NULL,   -- FK a rrhh_empleado (NULL en reservas automáticas web)
    id_pedido INT NULL,     -- FK a PEDIDO (e-Commerce)
    id_devolucion INT NULL, -- FK a DEVOLUCION (Postventa)
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_operacion VARCHAR(20) NOT NULL CHECK (
        tipo_operacion IN ('INGRESO', 'EGRESO', 'RESERVA', 'LIBERACION', 'AJUSTE', 'DEVOLUCION')
    ),
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADO' CHECK (
        estado IN ('PENDIENTE', 'COMPLETADO', 'ANULADO')
    ),
    motivo VARCHAR(50) NULL, -- Para AJUSTE: CONTEO, MERMA, PERDIDA, CORRECCION
    observacion VARCHAR(255) NULL
);

-- 6. Detalle de Movimientos
CREATE TABLE IF NOT EXISTS inventario.inv_detalles_movimiento (
    id_detalle SERIAL PRIMARY KEY,
    id_movimiento INT NOT NULL REFERENCES inventario.inv_movimiento(id_movimiento),
    id_producto INT NOT NULL REFERENCES inventario.inv_producto(id_producto),
    id_bodega INT NOT NULL REFERENCES inventario.inv_bodegas(id_bodega),
    cantidad INT NOT NULL CHECK (cantidad > 0)
);

-- 7. Especialización: Recepciones de Compra (INGRESO)
CREATE TABLE IF NOT EXISTS inventario.inv_recepciones_compra (
    id_movimiento INT PRIMARY KEY REFERENCES inventario.inv_movimiento(id_movimiento),
    id_proveedor INT NOT NULL, -- FK a PROVEEDOR (Compras)
    id_oc INT NULL,            -- FK a ORDEN_COMPRA (Compras)
    nro_guia_proveedor VARCHAR(100) NOT NULL
);

-- 8. Especialización: Despachos de Operario (EGRESO)
CREATE TABLE IF NOT EXISTS inventario.inv_despachos_operario (
    id_movimiento INT PRIMARY KEY REFERENCES inventario.inv_movimiento(id_movimiento),
    id_despacho INT NULL,      -- FK a DESPACHO (Logística)
    observaciones_picking VARCHAR(255)
);

-- =========================================================================
-- ÍNDICES RECOMENDADOS (Para el Patrón Repository y búsqueda rápida)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_inv_producto_sku ON inventario.inv_producto(sku);
CREATE INDEX IF NOT EXISTS idx_inv_producto_tema ON inventario.inv_producto(id_tema);
CREATE INDEX IF NOT EXISTS idx_inv_movimiento_pedido ON inventario.inv_movimiento(id_pedido);