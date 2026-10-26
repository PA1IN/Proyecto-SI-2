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

  private getManager(manager?: EntityManager): Repository<InvStockBodega> {
    return manager ? manager.getRepository(InvStockBodega) : this.repo;
  }

  async findStockPorProducto(idProducto: number): Promise<InvStockBodega[]> {
    return this.repo.find({
      where: { id_producto: idProducto },
      relations: { bodega: true },
      order: { id_bodega: 'ASC' },
    });
  }

  async findBodegasConLockParaReserva(
    idProducto: number,
    manager: EntityManager,
  ): Promise<InvStockBodega[]> {
    return this.getManager(manager)
      .createQueryBuilder('s')
      .setLock('pessimistic_write')
      .where('s.id_producto = :idProducto', { idProducto })
      .getMany();
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
        cantidad_disponible: () => 'cantidad_disponible - :cantidad',
        cantidad_reservada: () => 'cantidad_reservada + :cantidad',
      })
      .setParameter('cantidad', cantidad)
      .where('id_producto = :idProducto AND id_bodega = :idBodega', {
        idProducto,
        idBodega,
      })
      .andWhere('cantidad_disponible >= :cantidad')
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
