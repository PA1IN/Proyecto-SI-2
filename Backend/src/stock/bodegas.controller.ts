import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service.js';

@ApiTags('bodegas')
@Controller('bodegas')
export class BodegasController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async obtenerBodegas() {
    //mem
    return this.stockService.obtenerBodegas();
  }
}
