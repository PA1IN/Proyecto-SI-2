import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InvProducto } from '../catalogo/entities/inv-producto.entity.js';
import { InvBodegas } from '../stock/entities/inv-bodegas.entity.js';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';
import { MovimientoRepository } from './repositories/movimiento.repository.js';

@Injectable()
export class MovimientosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stockRepo: StockRepository,
    private readonly movimientoRepo: MovimientoRepository,
    private readonly reservaStrategy: ReservaStrategy,
  ) {}

  async obtenerHistorial(): Promise<InvMovimiento[]> {
    return this.movimientoRepo.findHistorial();
  }

  async obtenerMovimientoPorId(id: number): Promise<InvMovimiento> {
    const mov = await this.movimientoRepo.findById(id);
    if (!mov) {
      throw new NotFoundException(
        `Movimiento ${id} no encontrado en el sistema`,
      );
    }
    return mov;
  }

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

      const movimiento = await this.movimientoRepo.crearCabecera(
        {
          // TODO paso 8: sacarlo del token.
          id_empleado: dto.id_empleado,
          tipo_operacion: 'INGRESO',
          estado: 'COMPLETADO',
        },
        manager,
      );

      const detalle = await this.movimientoRepo.crearDetalle(
        {
          id_movimiento: movimiento.id_movimiento,
          id_producto: dto.id_producto,
          id_bodega: dto.id_bodega,
          cantidad: dto.cantidad,
        },
        manager,
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

  async registrarAjuste(dto: RegistrarAjusteDto): Promise<InvMovimiento> {
    return this.dataSource.transaction(async (manager) => {
      const producto = await manager.findOneBy(InvProducto, {
        id_producto: dto.id_producto,
      });
      if (!producto || !producto.activo) {
        throw new NotFoundException('Producto Inválido');
      }

      const bodegaExiste = await manager.existsBy(InvBodegas, {
        id_bodega: dto.id_bodega,
      });
      if (!bodegaExiste) {
        throw new NotFoundException('Bodega inválida');
      }

      if (dto.cantidad > 0) {
        await this.stockRepo.sumarDisponible(
          dto.id_producto,
          dto.id_bodega,
          dto.cantidad,
          manager,
        );
      } else if (
        !(await this.stockRepo.restarDisponible(
          dto.id_producto,
          dto.id_bodega,
          -dto.cantidad,
          manager,
        ))
      ) {
        throw new ConflictException(
          'Stock insuficiente para realizar el ajuste negativo',
        );
      }

      const movimiento = await this.movimientoRepo.crearCabecera(
        {
          // TODO paso 8: sacarlo del token.
          id_empleado: dto.id_empleado,
          tipo_operacion: 'AJUSTE',
          estado: 'COMPLETADO',
        },
        manager,
      );

      const detalle = await this.movimientoRepo.crearDetalle(
        {
          id_movimiento: movimiento.id_movimiento,
          id_producto: dto.id_producto,
          id_bodega: dto.id_bodega,
          cantidad: dto.cantidad,
        },
        manager,
      );

      movimiento.detalles = [detalle];
      return movimiento;
    });
  }
}
