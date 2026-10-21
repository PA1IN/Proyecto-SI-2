-- Fuente: Rebrickable (rebrickable.com/downloads), descargado el 21-10-2026.
-- Temas raíz de Rebrickable usados por los productos de 03_productos.sql.

BEGIN;

INSERT INTO inventario.inv_temas (id_tema, nombre_tema) VALUES
  (1, 'City'),
  (2, 'Star Wars'),
  (3, 'Friends'),
  (4, 'Super Heroes Marvel'),
  (5, 'Ninjago'),
  (6, 'Disney'),
  (7, 'Creator'),
  (8, 'Technic'),
  (9, 'Harry Potter'),
  (10, 'Super Mario'),
  (11, 'Minecraft'),
  (12, 'Icons')
ON CONFLICT (id_tema) DO NOTHING;

-- Los ids se insertaron a mano: se ajusta la secuencia para los próximos INSERT.
SELECT setval(pg_get_serial_sequence('inventario.inv_temas', 'id_tema'), (SELECT max(id_tema) FROM inventario.inv_temas));

COMMIT;
