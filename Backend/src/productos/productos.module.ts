import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service.js';
import { ProductosController } from './productos.controller.js';

@Module({
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}