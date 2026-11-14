import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, QueryFailedError } from 'typeorm';
import { InvProducto } from '../catalogo/entities/inv-producto.entity.js';
import { InvBodegas } from '../stock/entities/inv-bodegas.entity.js';
import { StockRepository } from '../stock/repositories/stock.repository.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto.js';
import { RegistrarReservaDto } from './dto/registrar-reserva.dto.js';
import { LiberarReservaDto } from './dto/liberar-reserva.dto.js';
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

  // Todo o nada: si una línea no alcanza, ReservaStrategy lanza 409 y se deshace todo.
  // Idempotente por id_pedido: un reintento devuelve la reserva que ya existe.
  async registrarReserva(dto: RegistrarReservaDto): Promise<InvMovimiento> {
    const existente = await this.movimientoRepo.findPorPedido(
      dto.id_pedido,
      'RESERVA',
    );
    if (existente) return this.reservaExistente(existente);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const ids = dto.lineas.map((l) => l.id_producto);
        const productos = await manager.findBy(InvProducto, {
          id_producto: In(ids),
        });
        for (const id of ids) {
          const producto = productos.find((p) => p.id_producto === id);
          if (!producto?.activo) {
            throw new NotFoundException(
              `El producto con ID ${id} no existe o está inactivo`,
            );
          }
        }

        // La cabecera va primero: si llega otra reserva del mismo pedido, el índice único
        // la frena aquí, antes de tocar el stock.
        const movimiento = await this.movimientoRepo.crearCabecera(
          {
            id_empleado: null,
            id_pedido: dto.id_pedido,
            tipo_operacion: 'RESERVA',
            estado: 'PENDIENTE',
          },
          manager,
        );

        // Se bloquea el stock siempre en el mismo orden para que dos pedidos no se traben.
        const lineas = [...dto.lineas].sort(
          (a, b) => a.id_producto - b.id_producto,
        );
        movimiento.detalles = [];
        for (const linea of lineas) {
          const asignaciones = await this.reservaStrategy.ejecutar(
            {
              idProducto: linea.id_producto,
              cantidad: linea.cantidad,
              idPedido: dto.id_pedido,
            },
            manager,
          );
          for (const asignacion of asignaciones) {
            movimiento.detalles.push(
              await this.movimientoRepo.crearDetalle(
                {
                  id_movimiento: movimiento.id_movimiento,
                  id_producto: linea.id_producto,
                  id_bodega: asignacion.id_bodega,
                  cantidad: asignacion.cantidad_asignada,
                },
                manager,
              ),
            );
          }
        }
        return movimiento;
      });
    } catch (error) {
      // Dos reintentos simultáneos: el que perdió devuelve la reserva del que ganó.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { constraint?: string })?.constraint ===
          'uq_reserva_por_pedido'
      ) {
        const reserva = await this.movimientoRepo.findPorPedido(
          dto.id_pedido,
          'RESERVA',
        );
        if (reserva) return this.reservaExistente(reserva);
      }
      throw error;
    }
  }

  // Un reintento recibe la misma reserva; un pedido cancelado no se reactiva (acordado con
  // e-Commerce): debe crear otro pedido con un id nuevo.
  private reservaExistente(reserva: InvMovimiento): InvMovimiento {
    if (reserva.estado === 'ANULADO') {
      throw new ConflictException(
        `El pedido ${reserva.id_pedido} fue cancelado; cree un pedido nuevo`,
      );
    }
    return reserva;
  }

  // Devuelve todo lo reservado del pedido a disponible, en las mismas bodegas, crea la
  // LIBERACION y deja la reserva ANULADO. Idempotente: si ya estaba anulada, devuelve la
  // liberación existente.
  async liberarReserva(dto: LiberarReservaDto): Promise<InvMovimiento> {
    return this.dataSource.transaction(async (manager) => {
      const reserva = await this.movimientoRepo.findReservaParaActualizar(
        dto.id_pedido,
        manager,
      );
      if (!reserva) {
        throw new NotFoundException(
          `El pedido ${dto.id_pedido} no tiene una reserva`,
        );
      }
      if (reserva.estado === 'ANULADO') {
        const liberacion = await this.movimientoRepo.findPorPedido(
          dto.id_pedido,
          'LIBERACION',
        );
        if (liberacion) return liberacion;
      }
      if (reserva.estado !== 'PENDIENTE') {
        // COMPLETADO = ya se despachó; no se puede liberar.
        throw new ConflictException(
          `La reserva del pedido ${dto.id_pedido} está ${reserva.estado}`,
        );
      }

      for (const detalle of reserva.detalles) {
        const liberado = await this.stockRepo.liberarReservado(
          detalle.id_producto,
          detalle.id_bodega,
          detalle.cantidad,
          manager,
        );
        if (!liberado) {
          throw new ConflictException(
            `El stock reservado del producto ${detalle.id_producto} en la bodega ${detalle.id_bodega} no coincide con la reserva`,
          );
        }
      }

      const liberacion = await this.movimientoRepo.crearCabecera(
        {
          id_empleado: null,
          id_pedido: dto.id_pedido,
          tipo_operacion: 'LIBERACION',
          estado: 'COMPLETADO',
        },
        manager,
      );
      liberacion.detalles = [];
      for (const detalle of reserva.detalles) {
        liberacion.detalles.push(
          await this.movimientoRepo.crearDetalle(
            {
              id_movimiento: liberacion.id_movimiento,
              id_producto: detalle.id_producto,
              id_bodega: detalle.id_bodega,
              cantidad: detalle.cantidad,
            },
            manager,
          ),
        );
      }

      await this.movimientoRepo.actualizarEstado(
        reserva.id_movimiento,
        'ANULADO',
        manager,
      );
      return liberacion;
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
