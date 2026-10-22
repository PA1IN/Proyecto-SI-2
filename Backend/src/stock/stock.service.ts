import { Injectable, NotFoundException } from '@nestjs/common';
import { StockRepository } from './repositories/stock.repository.js';
import { InvStockBodega } from './entities/inv-stock-bodega.entity.js';

@Injectable()
export class StockService {
  constructor(private readonly stockRepo: StockRepository) {}

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