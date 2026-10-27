import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service.js';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // Resumen por producto (todas las bodegas sumadas), para el listado del front en una sola request.
  @Get()
  async obtenerResumenStock() {
    return this.stockService.obtenerResumenStock();
  }

  @Get(':idProducto')
  async obtenerStockPorProducto(
    @Param('idProducto', ParseIntPipe) idProducto: number,
  ) {
    return this.stockService.obtenerStockPorProducto(idProducto);
  }
}
