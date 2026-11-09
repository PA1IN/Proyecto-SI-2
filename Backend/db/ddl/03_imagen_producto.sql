-- Imagen del producto: se guarda solo la URL (Rebrickable o Cloudinary), nunca el archivo.
-- Acordado con e-Commerce el 09-11-2026: la imagen vive en el maestro de productos.

BEGIN;

ALTER TABLE inventario.inv_producto
  ADD COLUMN IF NOT EXISTS url_imagen varchar(500);

COMMIT;
