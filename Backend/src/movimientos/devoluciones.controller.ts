import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ROLES } from '../auth/roles.constants.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { MovimientosService } from './movimientos.service.js';

@ApiTags('movimientos')
@Controller('devoluciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA)
@ApiBearerAuth()
export class DevolucionesController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get(':id')
  async obtenerDevolucion(@Param('id', ParseIntPipe) id: number) {
    return this.movimientosService.obtenerDevolucionPorId(id);
  }
}
