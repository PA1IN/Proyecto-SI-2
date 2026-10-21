
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { InvStockBodega } from '../entities/inv-stock-bodega.entity.js';

@Injectable()
export class StockRepository {
  constructor(
    @InjectRepository(InvStockBodega)
    private readonly repo: Repository<InvStockBodega>,
  ) {}

  private getManager(manager?: EntityManager) {
    return manager ? manager.getRepository(InvStockBodega) : this.repo;
  }

  async reservarStockAtomico(
    idProducto: number,
    idBodega: number,
    cantidad: number,
    manager: EntityManager,
  ): Promise<boolean> {
    const result = await this.getManager(manager)
      .createQueryBuilder()
      .update(InvStockBodega)
      .set({
        cantidad_disponible: () => `cantidad_disponible - ${cantidad}`,
        cantidad_reservada: () => `cantidad_reservada + ${cantidad}`,
      })
      .where('id_producto = :idProducto AND id_bodega = :idBodega', { idProducto, idBodega })
      .andWhere('cantidad_disponible >= :cantidad', { cantidad })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}