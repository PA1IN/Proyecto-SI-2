import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }), 
    HealthModule,
    DatabaseModule,
  ],
})
export class AppModule {}
