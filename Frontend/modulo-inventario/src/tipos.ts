export interface Producto {
  id_producto: number;
  sku: string;
  nombre_set: string;
  tema: string;
  cant_piezas: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  stock_minimo: number; 
  activo: boolean;
  bodegas_bajo_minimo: number; // NUEVO: para la alerta por bodega
}


export interface Bodega {
  id_bodega: number;
  nombre_bodega: string;
  ubicacion_fisica: string;
}

export interface DetalleStock {
  id_bodega: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_minima: number;
  bodega: {
    nombre_bodega: string;
    ubicacion_fisica: string;
  };
}