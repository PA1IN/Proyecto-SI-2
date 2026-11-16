export interface ProductoConStock {
  id_producto: number;
  id_tema: number;
  sku: string;
  nombre_set: string;
  cant_piezas: number;
  activo: boolean;
  url_imagen: string | null;
  peso_unitario_kg: number | null;
  largo_cm: number | null;
  alto_cm: number | null;
  ancho_cm: number | null;
  tema: { id_tema: number; nombre_tema: string };
  // Disponible para vender: suma de todas las bodegas (no incluye lo reservado).
  cantidad_disponible: number;
}
