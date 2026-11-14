import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  EstadoMovimiento,
  InvMovimiento,
  TipoOperacion,
} from '../entities/inv-movimiento.entity.js';
import { InvDetalleMovimiento } from '../entities/inv-detalle-movimiento.entity.js';

@Injectable()
export class MovimientoRepository {
  constructor(
    @InjectRepository(InvMovimiento)
    private readonly repo: Repository<InvMovimiento>,
  ) {}

  private getManager(manager?: EntityManager): Repository<InvMovimiento> {
    return manager ? manager.getRepository(InvMovimiento) : this.repo;
  }

  async crearCabecera(
    datos: Partial<InvMovimiento>,
    manager: EntityManager,
  ): Promise<InvMovimiento> {
    const repo = this.getManager(manager);
    return repo.save(repo.create(datos));
  }

  async crearDetalle(
    datos: Partial<InvDetalleMovimiento>,
    manager: EntityManager,
  ): Promise<InvDetalleMovimiento> {
    const repo = manager.getRepository(InvDetalleMovimiento);
    return repo.save(repo.create(datos));
  }

  async findHistorial(): Promise<InvMovimiento[]> {
    return this.repo.find({
      relations: { detalles: { producto: true, bodega: true } },
      order: { fecha_registro: 'DESC' },
      take: 100,
    });
  }

  // Para RESERVA hay a lo más una por pedido (índice uq_reserva_por_pedido).
  async findPorPedido(
    id_pedido: number,
    tipo_operacion: TipoOperacion,
  ): Promise<InvMovimiento | null> {
    return this.repo.findOne({
      where: { id_pedido, tipo_operacion },
      relations: { detalles: true },
      order: { id_movimiento: 'DESC' },
    });
  }

  // Bloquea la cabecera hasta el fin de la transacción: dos liberaciones del mismo pedido
  // se ejecutan una después de la otra. Sin relations, porque FOR UPDATE no admite LEFT JOIN.
  async findReservaParaActualizar(
    id_pedido: number,
    manager: EntityManager,
  ): Promise<InvMovimiento | null> {
    const reserva = await manager.getRepository(InvMovimiento).findOne({
      where: { id_pedido, tipo_operacion: 'RESERVA' },
      lock: { mode: 'pessimistic_write' },
    });
    if (reserva) {
      reserva.detalles = await manager
        .getRepository(InvDetalleMovimiento)
        .findBy({ id_movimiento: reserva.id_movimiento });
    }
    return reserva;
  }

  // El trigger solo permite cambiar el estado de un movimiento PENDIENTE.
  async actualizarEstado(
    id_movimiento: number,
    estado: EstadoMovimiento,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .getRepository(InvMovimiento)
      .update({ id_movimiento }, { estado });
  }

  async findById(id_movimiento: number): Promise<InvMovimiento | null> {
    return this.repo.findOne({
      where: { id_movimiento },
      relations: { detalles: { producto: true, bodega: true } },
    });
  }
}
