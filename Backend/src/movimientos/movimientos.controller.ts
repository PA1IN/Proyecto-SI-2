import {
  Controller,
  Get,
  Post,
  Body,
  ParseIntPipe,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { MovimientosService } from './movimientos.service.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto.js';
import { RegistrarReservaDto } from './dto/registrar-reserva.dto.js';
import { LiberarReservaDto } from './dto/liberar-reserva.dto.js';

@ApiTags('movimientos')
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  async obtenerHistorial() {
    return this.movimientosService.obtenerHistorial();
  }

  @Get(':id')
  async obtenerMovimientoPorId(@Param('id', ParseIntPipe) id: number) {
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

  // Lo llama e-Commerce tras confirmar el pago, con su API key.
  @Post('reserva')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  async registrarReserva(@Body() dto: RegistrarReservaDto) {
    return this.movimientosService.registrarReserva(dto);
  }

  // Lo llama e-Commerce al cancelar un pedido pagado, con su API key.
  @Post('liberacion')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  async liberarReserva(@Body() dto: LiberarReservaDto) {
    return this.movimientosService.liberarReserva(dto);
  }
}
