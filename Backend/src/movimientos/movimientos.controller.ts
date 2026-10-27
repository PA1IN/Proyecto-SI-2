import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MovimientosService } from './movimientos.service.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';

@ApiTags('movimientos')
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Post('ingreso')
  async registrarIngreso(@Body() dto: RegistrarIngresoDto) {
    return this.movimientosService.registrarIngreso(dto);
  }
}
