import { Injectable, NotFoundException } from '@nestjs/common';
import { StockRepository } from './repositories/stock.repository.js';
import { BodegaRepository } from './repositories/bodega.repository.js';
import { InvStockBodega } from './entities/inv-stock-bodega.entity.js';
import { InvBodegas } from './entities/inv-bodegas.entity.js';
import { ResumenStock } from './interfaces/resumen-stock.interface.js';

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
}
