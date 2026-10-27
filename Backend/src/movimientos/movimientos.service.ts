import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InvProducto } from '../catalogo/entities/inv-producto.entity.js';
import { InvBodegas } from '../stock/entities/inv-bodegas.entity.js';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { InvDetalleMovimiento } from './entities/inv-detalle-movimiento.entity.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';

@Injectable()
export class MovimientosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stockRepo: StockRepository,
  ) {}

  async registrarIngreso(dto: RegistrarIngresoDto): Promise<InvMovimiento> {
    return this.dataSource.transaction(async (manager) => {
      const producto = await manager.findOneBy(InvProducto, {
        id_producto: dto.id_producto,
      });
      if (!producto) {
        throw new NotFoundException(
          `El producto con ID ${dto.id_producto} no existe`,
        );
      }
      if (!producto.activo) {
        throw new NotFoundException(
          `El producto con ID ${dto.id_producto} está inactivo`,
        );
      }

      const bodegaExiste = await manager.existsBy(InvBodegas, {
        id_bodega: dto.id_bodega,
      });
      if (!bodegaExiste) {
        throw new NotFoundException(
          `La bodega con ID ${dto.id_bodega} no existe`,
        );
      }

      const movimiento = await manager.save(
        manager.create(InvMovimiento, {
          // TODO paso 8: sacarlo del token.
          id_empleado: dto.id_empleado,
          tipo_operacion: 'INGRESO',
          estado: 'COMPLETADO',
        }),
      );

      const detalle = await manager.save(
        manager.create(InvDetalleMovimiento, {
          id_movimiento: movimiento.id_movimiento,
          id_producto: dto.id_producto,
          id_bodega: dto.id_bodega,
          cantidad: dto.cantidad,
        }),
      );

      await this.stockRepo.sumarDisponible(
        dto.id_producto,
        dto.id_bodega,
        dto.cantidad,
        manager,
      );

      movimiento.detalles = [detalle];
      return movimiento;
    });
  }
}
