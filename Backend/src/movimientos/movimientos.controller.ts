import { Controller, Get, Post, Body, ParseIntPipe, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MovimientosService } from './movimientos.service.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto.js';


@ApiTags('movimientos')
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  async obtenerHistorial() {
    return this.movimientosService.obtenerHistorial();
  }

  @Get(':id')
  async obtenerMovimientoPorId(@Param('id', ParseIntPipe) id:number) {
    return this.movimientosService.obtenerMovimientoPorId(id);
  }

  @Post('ingreso')
  async registrarIngreso(@Body() dto: RegistrarIngresoDto) {
    return this.movimientosService.registrarIngreso(dto);
  }

  @Post('ajuste')
  async registrarAjuste(@Body() dto: RegistrarAjusteDto) {
    return this.movimientosService.registrarAjuste(dto);
  }
}
