import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvBodegas } from './entities/inv-bodegas.entity.js';
import { InvStockBodega } from './entities/inv-stock-bodega.entity.js';
import { StockRepository } from './repositories/stock.repository.js';
import { BodegaRepository } from './repositories/bodega.repository.js';
import { StockController } from './stock.controller.js';
import { BodegasController } from './bodegas.controller.js';
import { StockService } from './stock.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InvBodegas, InvStockBodega])],
  controllers: [StockController, BodegasController],
  providers: [StockRepository, BodegaRepository, StockService],
  exports: [StockRepository, StockService],
})
export class StockModule {}
