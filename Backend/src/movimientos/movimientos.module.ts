import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from '../stock/stock.module.js';
import { InvMovimiento } from './entities/inv-movimiento.entity.js';
import { InvDetalleMovimiento } from './entities/inv-detalle-movimiento.entity.js';
import { InvDespachoOperario } from './entities/inv-despacho-operario.entity.js';
import { InvRecepcionCompra } from './entities/inv-recepcion-compra.entity.js';
import { ReservaStrategy } from './strategies/reserva.strategy.js';
import { MovimientosController } from './movimientos.controller.js';
import { ReservasController } from './reservas.controller.js';
import { MovimientosService } from './movimientos.service.js';
import { MovimientoRepository } from './repositories/movimiento.repository.js';
import { PostventaRepository } from './repositories/postventa.repository.js';
import { DevolucionesController } from './devoluciones.controller.js';

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
  controllers: [
    MovimientosController,
    ReservasController,
    DevolucionesController,
  ],
  providers: [
    MovimientoRepository,
    MovimientosService,
    ReservaStrategy,
    PostventaRepository,
  ],
  exports: [MovimientoRepository],
})
export class MovimientosModule {}
