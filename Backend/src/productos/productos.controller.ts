import { Controller, Get } from '@nestjs/common';
import { ProductosService } from './productos.service.js';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  async obtenerProductos() {
    // NestJS automáticamente transforma el resultado a JSON
    // y lo envía con un código HTTP 200 (OK).
    return this.productosService.obtenerCatálogoParaFrontend();
  }
}