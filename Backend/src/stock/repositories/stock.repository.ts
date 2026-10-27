import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { InvStockBodega } from '../entities/inv-stock-bodega.entity.js';
import { ResumenStock } from '../interfaces/resumen-stock.interface.js';

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

  // Un producto activo sin filas de stock aparece con todo en 0. SUM devuelve bigint: se castea a int.
  async findResumenPorProducto(): Promise<ResumenStock[]> {
    return this.repo.query(
      `SELECT p.id_producto,
              COALESCE(SUM(s.cantidad_disponible), 0)::int AS cantidad_disponible,
              COALESCE(SUM(s.cantidad_reservada), 0)::int AS cantidad_reservada,
              COALESCE(SUM(s.cantidad_minima), 0)::int AS cantidad_minima,
              COUNT(*) FILTER (WHERE s.cantidad_disponible < s.cantidad_minima)::int AS bodegas_bajo_minimo
       FROM inventario.inv_producto p
       LEFT JOIN inventario.inv_stock_bodega s ON s.id_producto = p.id_producto
       WHERE p.activo
       GROUP BY p.id_producto
       ORDER BY p.id_producto`,
    );
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

  // Crea la fila de stock si el producto aún no está en la bodega.
  async sumarDisponible(
    idProducto: number,
    idBodega: number,
    cantidad: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO inventario.inv_stock_bodega (id_producto, id_bodega, cantidad_disponible)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_producto, id_bodega)
       DO UPDATE SET cantidad_disponible = inv_stock_bodega.cantidad_disponible + EXCLUDED.cantidad_disponible`,
      [idProducto, idBodega, cantidad],
    );
  }
}
