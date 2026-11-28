import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { DevolucionPostventa } from '../interfaces/devolucion-postventa.interface.js';

@Injectable()
export class PostventaRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findDevolucionPorId(
    idDevolucion: number,
    manager?: EntityManager,
  ): Promise<DevolucionPostventa | null> {
    const runner = manager ?? this.dataSource;
    const filas = await runner.query<DevolucionPostventa[]>(
      `SELECT d.id_devolucion,
              d.id_reclamo,
              r.id_venta AS id_pedido,
              d.id_producto,
              p.sku,
              p.nombre_set,
              d.cantidad,
              r.estado AS estado_reclamo
       FROM postventa.devolucion d
       JOIN postventa.reclamo r ON r.id_reclamo = d.id_reclamo
       LEFT JOIN inventario.inv_producto p ON p.id_producto = d.id_producto
       WHERE d.id_devolucion = $1`,
      [idDevolucion],
    );
    return filas[0] ?? null;
  }
}
