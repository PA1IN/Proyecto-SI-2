import { EntityManager } from 'typeorm';

export interface MovimientoContext {
  idProducto: number;
  cantidad: number;
  idPedido?: number;
  // ... otros datos del DTO
}

export interface MovimientoStrategy {
  ejecutar(context: MovimientoContext, manager: EntityManager): Promise<void>;
}