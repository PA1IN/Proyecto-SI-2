import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvBodegas } from './entities/inv-bodegas.entity.js';
import { InvStockBodega } from './entities/inv-stock-bodega.entity.js';
import { StockRepository } from './repositories/stock.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvBodegas, InvStockBodega])],
  providers: [StockRepository],
  exports: [StockRepository], 
})
export class StockModule {}