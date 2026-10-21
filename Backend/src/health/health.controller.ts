import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  // Sin BD por ahora: el chequeo de conexión se agrega junto con TypeORM.
  @Get()
  @ApiOkResponse({ description: 'El servicio está arriba' })
  check() {
    return { status: 'ok' };
  }
}
