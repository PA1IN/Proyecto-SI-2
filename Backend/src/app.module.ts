import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate })],
})
export class AppModule {}
