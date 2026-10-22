-- ==========================================
-- SEED INICIAL - MÓDULO INVENTARIO (GRUPO 2)
-- ==========================================

-- 1. Insertar Temas
INSERT INTO inventario.inv_temas (nombre_tema) VALUES 
('Star Wars'), ('Technic'), ('Icons'), ('Harry Potter'), ('Architecture'),
('Creator Expert'), ('Ideas'), ('Ninjago'), ('Speed Champions'), ('City');

-- 2. Insertar Bodegas (Donde guardaremos los LEGOs)
INSERT INTO inventario.inv_bodegas (nombre_bodega, ubicacion_fisica) VALUES 
('Bodega Central Santiago', 'Av. Las Industrias 1020, Quilicura'),
('Bodega Norte', 'Barrio Industrial 45, Coquimbo');

-- 3. Insertar 10 Productos LEGO reales (Catálogo)
INSERT INTO inventario.inv_producto 
(id_tema, sku, nombre_set, coleccion, cant_piezas, edad_minima, tipo_construccion, stock_minimo, activo) 
VALUES 
(1, '75192', 'Millennium Falcon', 'Ultimate Collector Series', 7541, 16, 'Nave', 2, true),
(1, '75313', 'AT-AT', 'Ultimate Collector Series', 6785, 18, 'Vehículo', 2, true),
(2, '42115', 'Lamborghini Sián FKP 37', 'Supercars', 3696, 18, 'Vehículo', 3, true),
(2, '42143', 'Ferrari Daytona SP3', 'Supercars', 3778, 18, 'Vehículo', 3, true),
(3, '10307', 'Eiffel Tower', 'Landmarks', 10001, 18, 'Estructura', 1, true),
(3, '10316', 'The Lord of the Rings: Rivendell', 'Fantasy', 6167, 18, 'Diorama', 2, true),
(4, '71043', 'Hogwarts Castle', 'Microscale', 6020, 16, 'Estructura', 2, true),
(5, '21056', 'Taj Mahal', 'Landmarks', 2022, 18, 'Estructura', 5, true),
(7, '21333', 'Vincent van Gogh - The Starry Night', 'Art', 2316, 18, 'Arte', 5, true),
(10, '60316', 'Police Station', 'City Core', 668, 6, 'Edificio', 10, true);

-- 4. Insertar Stock Físico en las Bodegas (Corazón del inventario)
-- Algunos productos estarán en Santiago, otros en Coquimbo, otros en ambas.
INSERT INTO inventario.inv_stock_bodega (id_producto, id_bodega, cantidad_disponible, cantidad_reservada) VALUES 
(1, 1, 5, 0), -- 5 Halcones en Santiago
(2, 1, 3, 1), -- 3 AT-AT en Stgo (1 reservado)
(3, 1, 10, 0), (3, 2, 5, 0), -- Lamborghinis en ambas bodegas
(4, 2, 8, 2), -- Ferraris solo en Coquimbo
(5, 1, 2, 0), -- 2 Torres Eiffel en Stgo
(6, 1, 6, 0), (6, 2, 4, 0), -- Rivendell repartido
(7, 2, 7, 0), -- Castillos de Hogwarts en Norte
(8, 1, 15, 0), -- Taj Mahal
(9, 1, 20, 0), (9, 2, 10, 0), -- Starry Night en ambas
(10, 1, 30, 0), (10, 2, 25, 0); -- Comisaría de policía masiva