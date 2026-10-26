import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvProducto } from './entities/inv-producto.entity.js';
import { InvTema } from './entities/inv-tema.entity.js';
import { CatalogoController } from './catalogo.controller.js';
import { ProductoRepository } from './repositories/producto.repository.js';
import { TemaRepository } from './repositories/tema.repository.js';
import { CatalogoService } from './catalogo.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvProducto, InvTema])],
  controllers: [CatalogoController],
  providers: [ProductoRepository, TemaRepository, CatalogoService],
  exports: [ProductoRepository],
})
export class CatalogoModule {}
