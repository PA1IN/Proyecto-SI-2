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
