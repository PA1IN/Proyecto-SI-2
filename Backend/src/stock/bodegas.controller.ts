import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ROLES } from '../auth/roles.constants.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { StockService } from './stock.service.js';
import { CrearBodegaDto } from './dto/crear-bodega.dto.js';
import { ActualizarBodegaDto } from './dto/actualizar-bodega.dto.js';

@ApiTags('bodegas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bodegas')
export class BodegasController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA, ROLES.CONSULTA)
  async obtenerBodegas() {
    return this.stockService.obtenerBodegas();
  }

  @Post()
  @Roles(ROLES.JEFE_BODEGA)
  async crearBodega(@Body() dto: CrearBodegaDto) {
    return this.stockService.crearBodega(dto);
  }

  @Patch(':id')
  @Roles(ROLES.JEFE_BODEGA)
  async actualizarBodega(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarBodegaDto,
  ) {
    return this.stockService.actualizarBodega(id, dto);
  }
}
