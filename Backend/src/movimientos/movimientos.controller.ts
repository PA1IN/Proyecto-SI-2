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
import { CurrentUser, Roles } from '../auth/auth.decorators.js';
import { ROLES } from '../auth/roles.constants.js'
import type { UsuarioAutenticado } from '../auth/roles.constants.js';
import { MovimientosService } from './movimientos.service.js';
import { RegistrarIngresoDto } from './dto/registrar-ingreso.dto.js';
import { RegistrarAjusteDto } from './dto/registrar-ajuste.dto.js';
import { RegistrarReservaDto } from './dto/registrar-reserva.dto.js';
import { LiberarReservaDto } from './dto/liberar-reserva.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { RegistrarDespachoDto } from './dto/registrar-despacho.dto.js';
import { RegistrarRecepcionDto } from './dto/registrar-recepcion.dto.js';

@ApiTags('movimientos')
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA)
  @ApiBearerAuth()
  async obtenerHistorial() {
    return this.movimientosService.obtenerHistorial();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA)
  @ApiBearerAuth()
  async obtenerMovimientoPorId(@Param('id', ParseIntPipe) id: number) {
    return this.movimientosService.obtenerMovimientoPorId(id);
  }

  @Post('ingreso')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA)
  @ApiBearerAuth()
  async registrarIngreso(@Body() dto: RegistrarIngresoDto, @CurrentUser() user: UsuarioAutenticado) {
    return this.movimientosService.registrarIngreso(dto, user.id_empleado);
  }

  @Post('ajuste')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLES.JEFE_BODEGA)
  @ApiBearerAuth()
  async registrarAjuste(@Body() dto: RegistrarAjusteDto, @CurrentUser() user: UsuarioAutenticado) {
    return this.movimientosService.registrarAjuste(dto, user.id_empleado);
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

  // Lo llama Logística al emitir la guía: EGRESO de lo recolectado y LIBERACION del resto.
  @Post('despacho')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  async registrarDespacho(@Body() dto: RegistrarDespachoDto) {
    return this.movimientosService.registrarDespacho(dto);
  }

  // Lo llama Logística al recibir una OC en el muelle: INGRESO de lo neto por bodega.
  @Post('recepcion')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  async registrarRecepcion(@Body() dto: RegistrarRecepcionDto) {
    return this.movimientosService.registrarRecepcion(dto);
  }
}
