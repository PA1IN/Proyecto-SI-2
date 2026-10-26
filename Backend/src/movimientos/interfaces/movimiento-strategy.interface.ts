import { EntityManager } from 'typeorm';
import { MovimientoContext } from './movimiento-context.interface.js';

export interface MovimientoStrategy {
  ejecutar(context: MovimientoContext, manager: EntityManager): Promise<void>;
}
