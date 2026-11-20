import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { CurrentUser, Public } from './auth.decorators.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { firmarJwtHs256 } from './jwt.util.js';
import { ROLES } from './roles.constants.js';
import type { UsuarioAutenticado } from './roles.constants.js';

class DevTokenDto {
  @ApiProperty({
    enum: [
      ROLES.JEFE_BODEGA,
      ROLES.OPERADOR_BODEGA,
      ROLES.CONSULTA,
      'Jefe',
      'Operador',
      'Analista',
      'Consultor',
      'Administrador',
    ],
    example: ROLES.JEFE_BODEGA,
  })
  @IsString()
  @IsIn([
    ROLES.JEFE_BODEGA,
    ROLES.OPERADOR_BODEGA,
    ROLES.CONSULTA,
    'Jefe',
    'Operador',
    'Analista',
    'Consultor',
    'Administrador',
  ])
  role: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  employeeId?: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  // Solo para desarrollo y demos mientras no esté el login de RRHH. Requiere AUTH_DEV_TOKENS=true.
  @Public()
  @Post('dev-token')
  generarTokenDesarrollo(@Body() dto: DevTokenDto) {
    // Apagado por defecto: con el secreto compartido, cualquiera podría firmar tokens para todo el ERP.
    if (!this.config.get<boolean>('AUTH_DEV_TOKENS')) {
      throw new ForbiddenException(
        'Los tokens de prueba están deshabilitados (AUTH_DEV_TOKENS=false)',
      );
    }
    const secreto = this.config.get<string>('JWT_SECRET', '');
    const employeeId = dto.employeeId ?? 1;
    const exp = Math.floor(Date.now() / 1000) + 8 * 3600; // 8 horas como rrhh

    const accessToken = firmarJwtHs256(
      {
        sub: employeeId,
        employeeId,
        username: `emp_${employeeId}`,
        role: dto.role,
        source: 'dev',
        exp,
      },
      secreto,
    );

    return {
      accessToken,
      user: { employeeId, role: dto.role },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  obtenerPerfil(@CurrentUser() user: UsuarioAutenticado) {
    return user;
  }
}