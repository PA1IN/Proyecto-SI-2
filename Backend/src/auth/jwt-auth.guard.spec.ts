import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { firmarJwtHs256 } from './jwt.util.js';
import { ROLES } from './roles.constants.js';
import { RolesGuard } from './roles.guard.js';

const SECRETO = 'secreto-compartido-rrhh-1234';

function crearContexto(authorization?: string) {
  const request: Record<string, unknown> = { headers: { authorization } };
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { request, context };
}

describe('JwtAuthGuard y RolesGuard', () => {
  const reflector = {
    getAllAndOverride: () => false,
  } as unknown as Reflector;

  const guard = new JwtAuthGuard(
    { get: () => SECRETO } as unknown as ConfigService,
    reflector,
  );

  it.each([
    ['JEFE_BODEGA', ROLES.JEFE_BODEGA],
    ['Jefe Bodega', ROLES.JEFE_BODEGA],
    ['OPERADOR_BODEGA', ROLES.OPERADOR_BODEGA],
    ['operador-bodega', ROLES.OPERADOR_BODEGA],
    ['CONSULTA', ROLES.CONSULTA],
  ])(
    'acepta el rol %s de RRHH y lo mapea a %s',
    (rolEntrada, rolEsperado) => {
      const token = firmarJwtHs256(
        {
          employeeId: 7,
          role: rolEntrada,
          exp: Math.floor(Date.now() / 1000) + 60,
        },
        SECRETO,
      );
      const { request, context } = crearContexto(`Bearer ${token}`);

      expect(guard.canActivate(context)).toBe(true);
      expect(request.user).toMatchObject({
        id_empleado: 7,
        rol: rolEsperado,
        rolOriginal: rolEntrada,
      });
    },
  );

  it.each(['Jefe', 'Coordinador', 'Administrador', 'Analista', 'Operador'])(
    'rechaza el rol genérico %s de RRHH (no es del módulo)',
    (rol) => {
      const token = firmarJwtHs256(
        { employeeId: 7, role: rol, exp: Math.floor(Date.now() / 1000) + 60 },
        SECRETO,
      );
      expect(() =>
        guard.canActivate(crearContexto(`Bearer ${token}`).context),
      ).toThrow(UnauthorizedException);
    },
  );

  it('rechaza un token firmado con otro secreto o expirado', () => {
    const malo = firmarJwtHs256({ employeeId: 1, role: 'Jefe' }, 'otro-secreto');
    expect(() =>
      guard.canActivate(crearContexto(`Bearer ${malo}`).context),
    ).toThrow(UnauthorizedException);

    const expirado = firmarJwtHs256(
      { employeeId: 1, role: 'Jefe', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRETO,
    );
    expect(() =>
      guard.canActivate(crearContexto(`Bearer ${expirado}`).context),
    ).toThrow(UnauthorizedException);
  });

  it('RolesGuard permite el paso si el rol coincide y lanza 403 si no', () => {
    const rolesReflector = {
      getAllAndOverride: () => [ROLES.JEFE_BODEGA],
    } as unknown as Reflector;
    const rolesGuard = new RolesGuard(rolesReflector);

    const { request, context } = crearContexto();
    request.user = { id_empleado: 1, rol: ROLES.OPERADOR_BODEGA };
    expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);

    request.user = { id_empleado: 1, rol: ROLES.JEFE_BODEGA };
    expect(rolesGuard.canActivate(context)).toBe(true);
  });
});