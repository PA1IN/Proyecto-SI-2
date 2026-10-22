import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogoService } from './catalogo.service.js';
import { CrearProductoDto } from './dto/crear-producto.dto.js';

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

  @Post()
  async crearProducto(@Body() dto: CrearProductoDto) {
    return this.catalogoService.crearProducto(dto);
  }
}