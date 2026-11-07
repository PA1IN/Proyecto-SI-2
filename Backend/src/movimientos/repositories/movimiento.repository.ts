import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { InvMovimiento } from '../entities/inv-movimiento.entity.js';
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

  async findById(id_movimiento: number): Promise<InvMovimiento | null> {
    return this.repo.findOne({
      where: { id_movimiento },
      relations: { detalles: { producto: true, bodega: true } },
    });
  }
}
