import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvProducto } from '../entities/inv-producto.entity.js';
import { CrearProductoDto } from '../dto/crear-producto.dto.js';

@Injectable()
export class ProductoRepository {
  constructor(
    @InjectRepository(InvProducto)
    private readonly ormRepo: Repository<InvProducto>,
  ) {}

  async findAllActivos(): Promise<InvProducto[]> {
    return this.ormRepo.find({
      where: { activo: true },
      relations: { tema: true },
      order: { id_producto: 'ASC' },
    });
  }

  async findBySku(sku: string): Promise<InvProducto | null> {
    return this.ormRepo.findOne({
      where: { sku },
      relations: { tema: true },
    });
  }

  async crear(datos: CrearProductoDto): Promise<InvProducto> {
    const nuevo = this.ormRepo.create(datos);
    return this.ormRepo.save(nuevo);
  }
}
