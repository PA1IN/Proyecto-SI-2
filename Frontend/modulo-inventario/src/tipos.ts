export interface Producto {
  id_producto: number;
  sku: string;
  nombre_set: string;
  tema: string;
  cant_piezas: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  stock_minimo?: number | null;
  activo: boolean;
}


export interface Bodega {
  id_bodega: number;
  nombre_bodega: string;
  ubicacion_fisica: string;
}