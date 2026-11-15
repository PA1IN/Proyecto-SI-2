// Backend/src/auth/auth.module.ts
import { Global, Module } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard.js';
import { AuthController } from './auth.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [ApiKeyGuard, JwtAuthGuard, RolesGuard],
  exports: [ApiKeyGuard, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}