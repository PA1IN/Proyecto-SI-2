import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.decorators.js';
import { verificarJwtHs256 } from './jwt.util.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secreto: string;

  constructor(
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.secreto = this.config.get<string>('JWT_SECRET', '');
  }

  canActivate(context: ExecutionContext): boolean {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) return true;

    const request = context.switchToHttp().getRequest();
    const token = /^Bearer (.+)$/.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) {
      throw new UnauthorizedException(
        'Falta el token JWT (Authorization: Bearer)',
      );
    }

    request.user = verificarJwtHs256(token, this.secreto);
    return true;
  }
}