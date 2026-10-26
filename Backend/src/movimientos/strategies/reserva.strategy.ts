import { Injectable, ConflictException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { StockRepository } from '../../stock/repositories/stock.repository.js';
import { calcularAsignacionReserva } from '../../stock/utils/greedy-allocation.util.js';
import { MovimientoContext } from '../interfaces/movimiento-context.interface.js';
import { MovimientoStrategy } from '../interfaces/movimiento-strategy.interface.js';

@Injectable()
export class ReservaStrategy implements MovimientoStrategy {
  constructor(private readonly stockRepo: StockRepository) {}

  async ejecutar(context: MovimientoContext, manager: EntityManager): Promise<void> {
    const bodegas = await this.stockRepo.findBodegasConLockParaReserva(context.idProducto, manager);

    const asignaciones = calcularAsignacionReserva(bodegas, context.cantidad);
    
    if (!asignaciones) {
      throw new ConflictException('Stock insuficiente para cubrir la reserva completa');
    }

    for (const asig of asignaciones) {
      const exito = await this.stockRepo.reservarStockAtomico(
        context.idProducto, 
        asig.id_bodega, 
        asig.cantidad_asignada, 
        manager
      );
      if (!exito) throw new ConflictException('Error de concurrencia al reservar stock');
      
    }
  }
}