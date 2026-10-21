import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

// Formato único de error acordado entre módulos. Los errores no controlados
// responden 500 sin exponer detalles internos; el detalle queda en el log.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';
    let errorType = 'ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : ((body as any).message ?? exception.message);
      errorType = HttpStatus[status] ?? 'ERROR';
    } else if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as any)?.code;
      if (code === '23505' || code === 'P0001') { 
        status = HttpStatus.CONFLICT;
        message = 'Conflicto de datos o regla de negocio violada';
        errorType = 'CONFLICT';
      } else if (code === '23503' || code === '23514') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Datos referenciados inválidos o restricción fallida';
        errorType = 'BAD_REQUEST';
      }
      this.logger.warn(`Database Error [${code}]: ${exception.message}`);
    } else {
      this.logger.error(exception);
    }

    const response: ErrorResponse = {
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    };
    res.status(status).json(response);
  }
}
