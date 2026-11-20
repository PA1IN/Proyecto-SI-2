-- Estimación de peso y medidas de la caja según la cantidad de piezas (Rebrickable no las trae).
-- Fórmula acordada con Logística el 16-11-2026. Es la misma de src/catalogo/utils/estimar-medidas.util.ts,
-- que se usa al crear productos sin medidas: si cambia una, cambiar la otra.
--   peso_unitario_kg = 0,20 + 0,0011 × piezas (caja y manuales + ~1,1 g por pieza)
--   medidas (largo × ancho × alto, cm) por rango de piezas:
--     hasta 300: 26 × 19 × 6 · hasta 1.000: 38 × 26 × 7 · hasta 2.500: 48 × 38 × 9
--     hasta 5.000: 58 × 48 × 12 · más de 5.000: 70 × 50 × 17
-- Requiere db/ddl/06_medidas_producto.sql. Solo completa los campos vacíos: no pisa valores reales.
-- Se puede ejecutar más de una vez.

BEGIN;

UPDATE inventario.inv_producto p
SET peso_unitario_kg = COALESCE(p.peso_unitario_kg, e.peso_unitario_kg),
    largo_cm         = COALESCE(p.largo_cm, e.largo_cm),
    ancho_cm         = COALESCE(p.ancho_cm, e.ancho_cm),
    alto_cm          = COALESCE(p.alto_cm, e.alto_cm)
FROM (
  SELECT id_producto,
         round(0.20 + 0.0011 * cant_piezas, 2) AS peso_unitario_kg,
         CASE WHEN cant_piezas <= 300  THEN 26 WHEN cant_piezas <= 1000 THEN 38
              WHEN cant_piezas <= 2500 THEN 48 WHEN cant_piezas <= 5000 THEN 58 ELSE 70 END AS largo_cm,
         CASE WHEN cant_piezas <= 300  THEN 19 WHEN cant_piezas <= 1000 THEN 26
              WHEN cant_piezas <= 2500 THEN 38 WHEN cant_piezas <= 5000 THEN 48 ELSE 50 END AS ancho_cm,
         CASE WHEN cant_piezas <= 300  THEN 6  WHEN cant_piezas <= 1000 THEN 7
              WHEN cant_piezas <= 2500 THEN 9  WHEN cant_piezas <= 5000 THEN 12 ELSE 17 END AS alto_cm
  FROM inventario.inv_producto
) AS e
WHERE p.id_producto = e.id_producto
  AND (p.peso_unitario_kg IS NULL OR p.largo_cm IS NULL OR p.ancho_cm IS NULL OR p.alto_cm IS NULL);

COMMIT;
