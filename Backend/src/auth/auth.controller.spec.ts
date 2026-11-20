import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { AuthController } from './auth.controller.js';
import { verificarJwtHs256 } from './jwt.util.js';
import { ROLES } from './roles.constants.js';

const SECRETO = 'secreto-local-de-prueba-123';

function crearControlador(devTokens: boolean) {
  const valores: Record<string, unknown> = {
    AUTH_DEV_TOKENS: devTokens,
    JWT_SECRET: SECRETO,
  };
  return new AuthController({
    get: (clave: string) => valores[clave],
  } as unknown as ConfigService);
}

describe('AuthController.generarTokenDesarrollo', () => {
  it('responde 403 si AUTH_DEV_TOKENS está apagado', () => {
    expect(() =>
      crearControlador(false).generarTokenDesarrollo({
        role: ROLES.JEFE_BODEGA,
      }),
    ).toThrow(ForbiddenException);
  });

  it('emite un token válido si AUTH_DEV_TOKENS está activo', () => {
    const { accessToken } = crearControlador(true).generarTokenDesarrollo({
      role: ROLES.OPERADOR_BODEGA,
      employeeId: 4,
    });
    expect(verificarJwtHs256(accessToken, SECRETO)).toMatchObject({
      id_empleado: 4,
      rol: ROLES.OPERADOR_BODEGA,
    });
  });
});
