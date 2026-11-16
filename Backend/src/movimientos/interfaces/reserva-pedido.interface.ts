import { EstadoMovimiento } from '../entities/inv-movimiento.entity.js';

// Lo que Logística necesita para armar el picking: qué se reservó, de qué bodega y dónde está.
export interface ReservaPedido {
  id_pedido: number;
  id_movimiento: number;
  // PENDIENTE = por despachar; COMPLETADO = ya despachada; ANULADO = liberada.
  estado: EstadoMovimiento;
  fecha_registro: Date;
  lineas: {
    id_producto: number;
    sku: string;
    nombre_set: string;
    id_bodega: number;
    nombre_bodega: string;
    ubicacion_fisica: string;
    cantidad: number;
  }[];
}
