import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { MovimientosService } from './movimientos.service.js';
import { ConsultarReservaDto } from './dto/consultar-reserva.dto.js';

// Ruta acordada con Logística (GET /reservas?id_pedido=) para armar el picking.
@ApiTags('movimientos')
@Controller('reservas')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth()
export class ReservasController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  async obtenerReservaPorPedido(@Query() dto: ConsultarReservaDto) {
    return this.movimientosService.obtenerReservaPorPedido(dto.id_pedido);
  }
}
