import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  ParseIntPipe,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Roles } from '../auth/auth.decorators.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ROLES } from '../auth/roles.constants.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CatalogoService } from './catalogo.service.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto.js';

@ApiTags('catalogo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA, ROLES.CONSULTA)
  async obtenerProductos() {
    return this.catalogoService.obtenerProductos();
  }

  @Get('temas')
  @Roles(ROLES.JEFE_BODEGA, ROLES.OPERADOR_BODEGA, ROLES.CONSULTA)
  async obtenerTemas() {
    return this.catalogoService.obtenerTemas();
  }

  // Para e-Commerce: productos activos con su stock disponible total, en una sola request.
  @Public()
  @Get('catalogo')
  async obtenerCatalogoConStock() {
    return this.catalogoService.obtenerCatalogoConStock();
  }

  // Va después de las rutas fijas ('temas', 'catalogo') para que no las capture.
  @Public()
  @Get(':id')
  async obtenerProducto(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.obtenerProducto(id);
  }

  @Post()
  @Roles(ROLES.JEFE_BODEGA)
  async crearProducto(@Body() dto: CrearProductoDto) {
    return this.catalogoService.crearProducto(dto);
  }

  @Patch(':id')
  @Roles(ROLES.JEFE_BODEGA)
  async actualizarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.catalogoService.actualizarProducto(id, dto);
  }

  @Delete(':id')
  @Roles(ROLES.JEFE_BODEGA)
  async darDeBaja(@Param('id', ParseIntPipe) id: number) {
    await this.catalogoService.darDeBaja(id);
    return { mensaje: 'Producto dado de baja exitosamente' };
  }
}
