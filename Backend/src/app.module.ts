import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { StockModule } from './stock/stock.module.js';
import { MovimientosModule } from './movimientos/movimientos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    HealthModule,
    DatabaseModule,
    CatalogoModule,
    StockModule,
    MovimientosModule,
  ],
})
export class AppModule {}