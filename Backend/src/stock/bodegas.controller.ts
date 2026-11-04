import { Controller, Get, Param, ParseIntPipe, Post, Patch, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StockService } from './stock.service.js';
import { CrearBodegaDto } from './dto/crear-bodega.dto.js';
import { ActualizarBodegaDto } from './dto/actualizar-bodega.dto.js';

@ApiTags('bodegas')
@Controller('bodegas')
export class BodegasController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  async obtenerBodegas() {
    return this.stockService.obtenerBodegas();
  }

  @Post()
  async crearBodega(@Body() dto: CrearBodegaDto) {
    return this.stockService.crearBodega(dto);
  }

  @Patch(':id')
  async actualizarBodega(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarBodegaDto) {
    return this.stockService.actualizarBodega(id, dto);
  }
}
