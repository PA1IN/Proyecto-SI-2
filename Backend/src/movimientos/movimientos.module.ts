import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from '../stock/stock.module.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { InvDetalleMovimiento } from './entities/inv-detalle-movimiento.entity.js';
import { InvDespachoOperario } from './entities/inv-despacho-operario.entity.js';
import { InvRecepcionCompra } from './entities/inv-recepcion-compra.entity.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvMovimiento,
      InvDetalleMovimiento,
      InvDespachoOperario,
      InvRecepcionCompra,
    ]),
    StockModule,
  ],
  providers: [ReservaStrategy],
})
export class MovimientosModule {}
