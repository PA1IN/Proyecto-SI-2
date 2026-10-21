import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvProducto } from './entities/inv-producto.entity.js';
import { InvTema } from './entities/inv-tema.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvProducto, InvTema])],
  controllers: [],
  providers: [],
})
export class CatalogoModule {}