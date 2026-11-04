import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvBodegas } from '../entities/inv-bodegas.entity.js';
import { CrearBodegaDto } from '../dto/crear-bodega.dto.js';
import { ActualizarBodegaDto } from '../dto/actualizar-bodega.dto.js';

@Injectable()
export class BodegaRepository {
  constructor(
    @InjectRepository(InvBodegas)
    private readonly ormRepo: Repository<InvBodegas>,
  ) {}

  async findAll(): Promise<InvBodegas[]> {
    return this.ormRepo.find({
      order: { id_bodega: 'ASC' },
    });
  }

  async findById(id_bodega: number): Promise<InvBodegas | null> {
    return this.ormRepo.findOneBy({ id_bodega});
  }

  async findByNombre(nombre_bodega: string): Promise<InvBodegas | null>{
    return this.ormRepo.findOneBy({nombre_bodega});
  }

  async crear(datos: CrearBodegaDto): Promise<InvBodegas> {
    return this.ormRepo.save(this.ormRepo.create(datos));
  }

  async actualizar(id_bodega:number, datos: ActualizarBodegaDto): Promise<void> {
    await this.ormRepo.update(id_bodega, datos);
  }
}
