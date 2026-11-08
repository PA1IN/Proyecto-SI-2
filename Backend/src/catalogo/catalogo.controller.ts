import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  ParseIntPipe,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogoService } from './catalogo.service.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';
import { ActualizarProductoDto } from './dto/actualizar-producto.dto.js';

@ApiTags('catalogo')
@Controller('productos')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  async obtenerProductos() {
    return this.catalogoService.obtenerProductos();
  }

  @Get('temas')
  async obtenerTemas() {
    return this.catalogoService.obtenerTemas();
  }

  // Para e-Commerce: productos activos con su stock disponible total, en una sola request.
  @Get('catalogo')
  async obtenerCatalogoConStock() {
    return this.catalogoService.obtenerCatalogoConStock();
  }

  // Va después de las rutas fijas ('temas', 'catalogo') para que no las capture.
  @Get(':id')
  async obtenerProducto(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.obtenerProducto(id);
  }

  @Post()
  async crearProducto(@Body() dto: CrearProductoDto) {
    return this.catalogoService.crearProducto(dto);
  }

  @Patch(':id')
  async actualizarProducto(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.catalogoService.actualizarProducto(id, dto);
  }

  @Delete(':id')
  async darDeBaja(@Param('id', ParseIntPipe) id: number) {
    await this.catalogoService.darDeBaja(id);
    return { mensaje: 'Producto dado de baja exitosamente' };
  }
}
