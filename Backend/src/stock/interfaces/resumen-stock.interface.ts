export interface ResumenStock {
  id_producto: number;
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_minima: number;
  // El stock bajo se mide por bodega: cuántas están bajo su mínimo.
  bodegas_bajo_minimo: number;
}
