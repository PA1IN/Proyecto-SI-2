export interface MovimientoContext {
  idProducto: number;
  cantidad: number;
  idPedido?: number;
  idBodega?: number;
  motivo?: string;
}
