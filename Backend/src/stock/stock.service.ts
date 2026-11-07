import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockRepository } from './repositories/stock.repository.js';
import { BodegaRepository } from './repositories/bodega.repository.js';
import { InvStockBodega } from './entities/inv-stock-bodega.entity.js';
import { InvBodegas } from './entities/inv-bodegas.entity.js';
import { ResumenStock } from './interfaces/resumen-stock.interface.js';
import { CrearBodegaDto } from './dto/crear-bodega.dto.js';
import { ActualizarBodegaDto } from './dto/actualizar-bodega.dto.js';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepo: StockRepository,
    private readonly bodegaRepo: BodegaRepository,
  ) {}

  async obtenerBodegas(): Promise<InvBodegas[]> {
    return this.bodegaRepo.findAll();
  }

  async obtenerResumenStock(): Promise<ResumenStock[]> {
    return this.stockRepo.findResumenPorProducto();
  }

  async obtenerStockPorProducto(idProducto: number): Promise<InvStockBodega[]> {
    const stock = await this.stockRepo.findStockPorProducto(idProducto);
    if (stock.length === 0) {
      throw new NotFoundException(
        `No hay registros de stock para el producto con ID ${idProducto}`,
      );
    }
    return stock;
  }

  async crearBodega(dto: CrearBodegaDto): Promise<InvBodegas> {
    const existe = await this.bodegaRepo.findByNombre(dto.nombre_bodega);
    if (existe) {
      throw new ConflictException(
        `La bodega '${dto.nombre_bodega}' ya existe en el sistema`,
      );
    }
    return this.bodegaRepo.crear(dto);
  }

  async actualizarBodega(
    id: number,
    dto: ActualizarBodegaDto,
  ): Promise<InvBodegas> {
    // Sin campos, TypeORM lanza error al actualizar y saldría un 500.
    if (Object.values(dto).every((v) => v === undefined)) {
      throw new BadRequestException(
        'Debe enviar al menos un campo a actualizar',
      );
    }

    const bodega = await this.bodegaRepo.findById(id);
    if (!bodega) {
      throw new NotFoundException(`Bodega ${id} no encontrada en el sistema`);
    }

    if (dto.nombre_bodega && dto.nombre_bodega !== bodega.nombre_bodega) {
      const existe = await this.bodegaRepo.findByNombre(dto.nombre_bodega);
      if (existe) {
        throw new ConflictException(
          `La bodega '${dto.nombre_bodega}' ya existe en el sistema`,
        );
      }
    }

    await this.bodegaRepo.actualizar(id, dto);
    return (await this.bodegaRepo.findById(id))!;
  }
}
