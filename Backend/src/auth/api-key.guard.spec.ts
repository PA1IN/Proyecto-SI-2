import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { ApiKeyGuard } from './api-key.guard.js';

const crearGuard = (claves: string) =>
  new ApiKeyGuard({
    get: () => claves,
  } as unknown as ConfigService);

const contexto = (authorization?: string) => {
  const request: Record<string, unknown> = { headers: { authorization } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { request, context };
};

describe('ApiKeyGuard', () => {
  const guard = crearGuard('ecommerce:clave-eco, logistica:clave:con:puntos');

  it('acepta una clave válida y deja el módulo en el request', () => {
    const { request, context } = contexto('Bearer clave-eco');
    expect(guard.canActivate(context)).toBe(true);
    expect(request.moduloCliente).toBe('ecommerce');
  });

  it('acepta claves que contienen ":"', () => {
    const { request, context } = contexto('Bearer clave:con:puntos');
    expect(guard.canActivate(context)).toBe(true);
    expect(request.moduloCliente).toBe('logistica');
  });

  it.each([undefined, '', 'clave-eco', 'Basic clave-eco', 'Bearer otra'])(
    'rechaza con 401 el header %j',
    (header) => {
      expect(() => guard.canActivate(contexto(header).context)).toThrow(
        UnauthorizedException,
      );
    },
  );

  it('sin claves configuradas rechaza todo', () => {
    const sinClaves = crearGuard('');
    expect(() => sinClaves.canActivate(contexto('Bearer x').context)).toThrow(
      UnauthorizedException,
    );
    expect(() => sinClaves.canActivate(contexto('Bearer ').context)).toThrow(
      UnauthorizedException,
    );
  });
});
