import { createHash, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const sha256 = (texto: string) => createHash('sha256').update(texto).digest();

// Protege los endpoints que consumen otros módulos (e-Commerce, Logística), donde no hay
// un empleado detrás. Se usa con @UseGuards(ApiKeyGuard) y deja el nombre del módulo que
// llama en request.moduloCliente.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  // [módulo, hash de su clave], desde INTEGRACION_API_KEYS="modulo:clave,modulo:clave".
  private readonly claves: [string, Buffer][];

  constructor(config: ConfigService) {
    this.claves = config
      .get<string>('INTEGRACION_API_KEYS', '')
      .split(',')
      .map((par) => par.trim())
      .filter(Boolean)
      .map((par) => {
        const i = par.indexOf(':');
        return [par.slice(0, i), sha256(par.slice(i + 1))];
      });
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = /^Bearer (.+)$/.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) {
      throw new UnauthorizedException(
        'Falta la API key (Authorization: Bearer)',
      );
    }

    // Se comparan hashes con timingSafeEqual para no filtrar la clave por tiempo de respuesta.
    const hash = sha256(token);
    const modulo = this.claves.find(([, clave]) =>
      timingSafeEqual(clave, hash),
    );
    if (!modulo) {
      throw new UnauthorizedException('API key inválida');
    }

    request.moduloCliente = modulo[0];
    return true;
  }
}
