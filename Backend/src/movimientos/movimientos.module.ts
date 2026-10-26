import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';

@Module({
  imports: [StockModule],
  providers: [ReservaStrategy],
})
export class MovimientosModule {}
