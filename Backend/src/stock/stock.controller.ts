import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators.js';
import { ROLES } from '../auth/roles.constants.js';
import { StockService } from './stock.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';

@ApiTags('stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // Resumen por producto (todas las bodegas sumadas), para el listado del front en una sola request.
  @Get()
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA, ROLES.CONSULTA)
  async obtenerResumenStock() {
    return this.stockService.obtenerResumenStock();
  }

  @Get(':idProducto')
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA, ROLES.CONSULTA)
  async obtenerStockPorProducto(
    @Param('idProducto', ParseIntPipe) idProducto: number,
  ) {
    return this.stockService.obtenerStockPorProducto(idProducto);
  }
}
