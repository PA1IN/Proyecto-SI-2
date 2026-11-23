export interface Tema {
  id_tema: number;
  nombre_tema: string;
}

export interface Producto {
  id_producto: number;
  id_tema: number;
  tema: Tema;
  sku: string;
  nombre_set: string;
  cant_piezas: number;
  activo: boolean;
  url_imagen: string | null;
  peso_unitario_kg: number | null;
  largo_cm: number | null;
  alto_cm: number | null;
  ancho_cm: number | null;
}

export interface StockResumen {
  id_producto: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_minima: number;
  bodegas_bajo_minimo: number;
}

export interface ProductoConStock extends Producto {
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_minima: number;
  bodegas_bajo_minimo: number;
}

export interface Bodega {
  id_bodega: number;
  nombre_bodega: string;
  ubicacion_fisica: string;
}

export interface StockBodega {
  id_producto: number;
  id_bodega: number;
  bodega: Bodega;
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_minima: number;
}

export type TipoOperacion =
  | 'INGRESO'
  | 'EGRESO'
  | 'RESERVA'
  | 'LIBERACION'
  | 'AJUSTE'
  | 'DEVOLUCION';

export type EstadoMovimiento = 'PENDIENTE' | 'COMPLETADO' | 'ANULADO';

export interface DetalleMovimiento {
  id_detalle: number;
  id_movimiento: number;
  id_producto: number;
  producto: Producto;
  id_bodega: number;
  bodega: Bodega;
  cantidad: number;
}

export interface Movimiento {
  id_movimiento: number;
  id_empleado: number;
  id_pedido: number | null;
  id_devolucion: number | null;
  fecha_registro: string;
  tipo_operacion: TipoOperacion;
  estado: EstadoMovimiento;
  detalles: DetalleMovimiento[];
}

export type Rol = 'JEFE_BODEGA' | 'OPERADOR_BODEGA' | 'CONSULTA';

export interface MedidasProducto {
  peso_unitario_kg: number | null;
  largo_cm: number | null;
  ancho_cm: number | null;
  alto_cm: number | null;
}

export interface PayloadProducto {
  id_tema: number;
  sku: string;
  nombre_set: string;
  cant_piezas: number;
  url_imagen?: string;
  peso_unitario_kg?: number;
  largo_cm?: number;
  alto_cm?: number;
  ancho_cm?: number;
}

export interface PayloadBodega {
  nombre_bodega: string;
  ubicacion_fisica: string;
}
