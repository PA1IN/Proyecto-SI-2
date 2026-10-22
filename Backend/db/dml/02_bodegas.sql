-- Bodegas de Lesgo (datos inventados por el equipo).

BEGIN;

INSERT INTO inventario.inv_bodegas (id_bodega, nombre_bodega, ubicacion_fisica) VALUES
  (1, 'Bodega Central Santiago', 'Av. Américo Vespucio 1500, Pudahuel, Santiago'),
  (2, 'Bodega Coquimbo', 'Av. Costanera 2300, Coquimbo'),
  (3, 'Bodega La Serena', 'Av. Balmaceda 3100, La Serena'),
  (4, 'Bodega Antofagasta', 'Av. Pedro Aguirre Cerda 9800, Antofagasta'),
  (5, 'Bodega Valparaíso', 'Av. España 2500, Valparaíso'),
  (6, 'Bodega Concepción', 'Av. Los Carrera 1800, Concepción'),
  (7, 'Bodega Temuco', 'Av. Caupolicán 950, Temuco'),
  (8, 'Bodega Puerto Montt', 'Ruta 5 Sur km 1020, Puerto Montt'),
  (9, 'Bodega Iquique', 'Zona Franca, Manzana 7, Iquique'),
  (10, 'Bodega Rancagua', 'Av. Einstein 600, Rancagua')
ON CONFLICT (id_bodega) DO NOTHING;

-- Ids explícitos para que la carga de stock (04) dé el mismo resultado en local y en Neon.
SELECT setval(pg_get_serial_sequence('inventario.inv_bodegas', 'id_bodega'), (SELECT max(id_bodega) FROM inventario.inv_bodegas));

COMMIT;
