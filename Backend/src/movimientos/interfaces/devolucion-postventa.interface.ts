export interface DevolucionPostventa {
  id_devolucion: number;
  id_reclamo: number;
  id_pedido: number;
  id_producto: number | null;
  sku: string | null;
  nombre_set: string | null;
  cantidad: number | null;
  estado_reclamo: string;
}

export interface ConsultaDevolucion {
  id_devolucion: number;
  id_pedido: number;
  producto: {
    id_producto: number;
    sku: string | null;
    nombre_set: string | null;
  } | null;
  cantidad: number | null;
  estado: string;
  recibida: boolean;
  id_movimiento: number | null;
}