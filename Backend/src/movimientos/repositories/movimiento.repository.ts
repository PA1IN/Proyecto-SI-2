import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  EstadoMovimiento,
  InvMovimiento,
  TipoOperacion,
} from '../entities/inv-movimiento.entity.js';
import { InvDetalleMovimiento } from '../entities/inv-detalle-movimiento.entity.js';
import { InvDespachoOperario } from '../entities/inv-despacho-operario.entity.js';
import { InvRecepcionCompra } from '../entities/inv-recepcion-compra.entity.js';

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
      // En el orden en que se reservaron: el despacho parcial descuenta en ese orden.
      reserva.detalles = await manager
        .getRepository(InvDetalleMovimiento)
        .find({
          where: { id_movimiento: reserva.id_movimiento },
          order: { id_detalle: 'ASC' },
        });
    }
    return reserva;
  }

  async crearDespacho(
    datos: Partial<InvDespachoOperario>,
    manager: EntityManager,
  ): Promise<InvDespachoOperario> {
    const repo = manager.getRepository(InvDespachoOperario);
    return repo.save(repo.create(datos));
  }

  // El EGRESO de una guía, con su detalle. id_despacho es UNIQUE: hay a lo más uno.
  async findEgresoPorDespacho(
    id_despacho: string,
    manager: EntityManager,
  ): Promise<InvMovimiento | null> {
    const despacho = await manager
      .getRepository(InvDespachoOperario)
      .findOneBy({ id_despacho });
    if (!despacho) return null;
    return manager.getRepository(InvMovimiento).findOne({
      where: { id_movimiento: despacho.id_movimiento },
      relations: { detalles: true },
    });
  }

  async crearRecepcion(
    datos: Partial<InvRecepcionCompra>,
    manager: EntityManager,
  ): Promise<InvRecepcionCompra> {
    const repo = manager.getRepository(InvRecepcionCompra);
    return repo.save(repo.create(datos));
  }

  // La recepción de una guía de proveedor, con el INGRESO y su detalle. (id_oc, nro_guia) es UNIQUE.
  async findRecepcion(
    id_oc: number,
    nro_guia_proveedor: string,
    manager: EntityManager,
  ): Promise<{ recepcion: InvRecepcionCompra; ingreso: InvMovimiento } | null> {
    const recepcion = await manager
      .getRepository(InvRecepcionCompra)
      .findOneBy({ id_oc, nro_guia_proveedor });
    if (!recepcion) return null;
    const ingreso = await manager.getRepository(InvMovimiento).findOne({
      where: { id_movimiento: recepcion.id_movimiento },
      relations: { detalles: true },
    });
    return { recepcion, ingreso: ingreso! };
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

  // Para DEVOLUCION hay a lo más una por id_devolucion (índice uq_devolucion_unica).
  async findPorDevolucion(
    id_devolucion: number,
    manager?: EntityManager,
  ): Promise<InvMovimiento | null> {
    return this.getManager(manager).findOne({
      where: { id_devolucion, tipo_operacion: 'DEVOLUCION' },
      relations: { detalles: true },
    });
  }
}
