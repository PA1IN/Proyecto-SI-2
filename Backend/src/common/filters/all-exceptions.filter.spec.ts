import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function mockHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: '/api/v1/prueba' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('responde una HttpException con su código y mensaje', () => {
    const { host, status, json } = mockHost();
    filter.catch(new ConflictException('Stock insuficiente'), host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        error: 'CONFLICT',
        message: 'Stock insuficiente',
        path: '/api/v1/prueba',
      }),
    );
  });

  it('mantiene la lista de errores del ValidationPipe', () => {
    const { host, json } = mockHost();
    filter.catch(new BadRequestException(['sku es obligatorio']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['sku es obligatorio'],
      }),
    );
  });

  it('responde 500 sin exponer el error interno', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, status, json } = mockHost();
    filter.catch(new Error('password de la BD en el mensaje'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error interno del servidor',
      }),
    );
  });
});
